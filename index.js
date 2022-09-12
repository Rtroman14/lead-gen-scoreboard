const Airtable = require("./src/Airtable");
const _ = require("./src/Helpers");
const accountStats = require("./src/accountStats");

const LEAD_GEN_TRACKER = "appGB7S9Wknu6MiQb";

(async () => {
    try {
        const workflows = await Airtable.recordsInView(
            LEAD_GEN_TRACKER,
            "Campaigns",
            "Text - workflow"
        );

        const liveWorkflows = workflows.filter(
            (workflow) => workflow["Campaign Status"] !== "Paused"
        );

        const clientAccounts = _.uniqueArrayOfObjects(liveWorkflows, ["Account", "Tag"]);

        const airtableFormatedRecords = Airtable.formatRecords(
            clientAccounts.map((record) => ({
                Account: record.Account,
                Client: record.Client,
                Tag: record.Tag || "",
                "Base ID": record["Base ID"],
            }))
        );

        let scoreboard = await Airtable.recordsInView(LEAD_GEN_TRACKER, "Scoreboard", "Scoreboard");

        const scoreboardRecordIDs = scoreboard.map((record) => record.recordID);
        if (scoreboardRecordIDs.length) {
            await Airtable.batchDelete(LEAD_GEN_TRACKER, scoreboardRecordIDs);
        }

        scoreboard = await Airtable.batchUpload(
            LEAD_GEN_TRACKER,
            "Scoreboard",
            airtableFormatedRecords
        );

        const accountStatsReq = clientAccounts.map((account) => accountStats(account));

        const accountStatsRes = await Promise.all(accountStatsReq);

        for (let accountStat of accountStatsRes) {
            // const scoreboardRecord = scoreboard.find((account) => {
            //     // let name = `${account.Account} - `;
            //     // if ("Tag" in account) {
            //     //     name = `${account.Account} - ${account.Tag}`;
            //     // }

            //     // let accountStatsName = `${accountStat.account} - ${accountStat.tag}`;
            //     // if (name === accountStatsName) {
            //     //     return account;
            //     // }
            //     if (account.Account === accountStat.account) {
            //         return account;
            //     }
            // });
            const scoreboardRecord = scoreboard.find(
                (account) => account.Account === accountStat.account
            );

            if (scoreboardRecord) {
                await Airtable.updateRecord(LEAD_GEN_TRACKER, scoreboardRecord.recordID, {
                    Prospects: accountStat.prospects,
                    Leads: accountStat.leads,
                });
            }
        }
    } catch (error) {
        console.log("ERROR - index.js ---", error);
    }
})();
