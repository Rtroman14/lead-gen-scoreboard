const Airtable = require("./src/Airtable");
const _ = require("./src/Helpers");
const accountStats = require("./src/accountStats");

const LEAD_GEN_TRACKER = "appGB7S9Wknu6MiQb";

(async () => {
    try {
        const workflowsReq = Airtable.recordsInView(
            LEAD_GEN_TRACKER,
            "Campaigns",
            "Text - workflow"
        );
        const scoreboardReq = Airtable.allRecords(LEAD_GEN_TRACKER, "Scoreboard");
        let [workflows, scoreboard] = await Promise.all([workflowsReq, scoreboardReq]);

        workflows = workflows.filter((workflow) => workflow["Campaign Status"] !== "Paused");
        workflows = _.uniqueArrayOfObjects(workflows, ["Account", "Tag"]);

        // * get all account stats
        const accountStatsReq = workflows.map((account) => accountStats(account));
        const accountStatsRes = await Promise.all(accountStatsReq);

        // * batch delete type === "Campaign"
        const scoreboardCampaignRecordIDs = scoreboard
            .filter((record) => record.Type === "Campaign")
            .map((record) => record.recordID);
        if (scoreboardCampaignRecordIDs.length) {
            await Airtable.batchDelete(LEAD_GEN_TRACKER, scoreboardCampaignRecordIDs);
        }

        // * batch upload type === "Campaign"
        const accountStatsAirtableFormated = Airtable.formatRecords(
            accountStatsRes.map((acc) => ({
                Account: acc.account,
                Client: acc.client,
                Tag: acc.tag,
                "Base ID": acc.baseID,
                Leads: acc.leads,
                Prospects: acc.prospects,
                Type: "Campaign",
            }))
        );
        await Airtable.batchUpload(LEAD_GEN_TRACKER, "Scoreboard", accountStatsAirtableFormated);

        // * conslidate accounts by "Account"
        let allAccounts = [];
        accountStatsRes.forEach((account) => {
            const foundAccount = allAccounts.find(
                (allAccount) => allAccount?.account === account.account
            );

            if (foundAccount) {
                allAccounts = allAccounts.map((acc) => {
                    if (acc.account === foundAccount.account) {
                        return {
                            ...acc,
                            leads: acc.leads + foundAccount.leads,
                            prospects: Math.min(acc.prospects, foundAccount.prospects),
                            tag: "",
                        };
                    }

                    return acc;
                });
            } else {
                allAccounts.push(account);
            }
        });

        // * update or add account
        for (let account of allAccounts) {
            const foundScoreboardAccount = scoreboard.find(
                (acc) => acc?.Account === account.account && acc.Type === "Account"
            );

            if (foundScoreboardAccount) {
                // update account
                await Airtable.updateRecord(LEAD_GEN_TRACKER, foundScoreboardAccount.recordID, {
                    Prospects: account.prospects,
                    Leads: account.leads,
                });
            } else {
                const formatedRecord = Airtable.formatRecord({
                    Account: account.account,
                    Client: account.client,
                    Tag: account.tag,
                    "Base ID": account.baseID,
                    Leads: account.leads,
                    Prospects: account.prospects,
                    Type: "Account",
                    Status: "Live",
                });
                // create account
                await Airtable.createRecords(LEAD_GEN_TRACKER, "Scoreboard", [formatedRecord]);
            }
        }
    } catch (error) {
        console.log("ERROR - index.js ---", error);
    }
})();
