const Airtable = require("./src/Airtable");
const _ = require("./src/Helpers");
const accountStats = require("./src/accountStats");

const LEAD_GEN_TRACKER_BASE_ID = "appGB7S9Wknu6MiQb";

(async () => {
    try {
        const workflowsReq = Airtable.recordsInView(
            LEAD_GEN_TRACKER_BASE_ID,
            "Campaigns",
            "Text - workflow"
        );
        const scoreboardReq = Airtable.allRecords(LEAD_GEN_TRACKER_BASE_ID, "Scoreboard");
        let [workflows, scoreboard] = await Promise.all([workflowsReq, scoreboardReq]);

        workflows = workflows.filter(
            (workflow) =>
                workflow["Campaign Status"] === "Live" ||
                workflow["Campaign Status"] === "Need More Contacts"
        );
        workflows = _.uniqueArrayOfObjects(workflows, ["Account", "Tag"]);

        // * get all account stats
        const accountStatsReq = workflows.map((account) => accountStats(account));
        const accountStatsRes = await Promise.all(accountStatsReq);

        // * batch delete all records
        const scoreboardCampaignRecordIDs = scoreboard.map((record) => record.recordID);
        if (scoreboardCampaignRecordIDs.length) {
            await Airtable.batchDelete(LEAD_GEN_TRACKER_BASE_ID, scoreboardCampaignRecordIDs);
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
        await Airtable.batchUpload(
            LEAD_GEN_TRACKER_BASE_ID,
            "Scoreboard",
            accountStatsAirtableFormated
        );

        // * conslidate accounts by "Account"
        // let allClients = [];
        // accountStatsRes.forEach((account) => {
        //     const foundClient = allClients.find(
        //         (allAccount) => allAccount?.account === account.account
        //     );

        //     if (foundClient) {
        //         allClients = allClients.map((acc) => {
        //             if (acc.account === foundClient.account) {
        //                 return {
        //                     ...acc,
        //                     leads: acc.leads + foundClient.leads,
        //                     prospects: Math.min(acc.prospects, foundClient.prospects),
        //                     tag: "",
        //                 };
        //             }

        //             return acc;
        //         });
        //     } else {
        //         allClients.push(account);
        //     }
        // });

        // * conslidate accounts by "Client"
        let allClients = [];
        accountStatsRes.forEach((account) => {
            const foundClient = allClients.find((client) => client?.client === account.client);

            if (foundClient) {
                allClients = allClients.map((acc) => {
                    if (acc.client === account.client) {
                        return {
                            ...account,
                            leads: acc.leads + account.leads,
                            prospects: Math.min(acc.prospects, account.prospects),
                            tag: "",
                        };
                    }

                    return acc;
                });
            } else {
                allClients.push(account);
            }
        });

        // * batch upload type === "Account"
        const clientAccounts = Airtable.formatRecords(
            allClients.map((acc) => ({
                Account: acc.account,
                Client: acc.client,
                Tag: "",
                "Base ID": acc.baseID,
                Leads: acc.leads,
                Prospects: acc.prospects,
                Type: "Account",
            }))
        );
        await Airtable.batchUpload(LEAD_GEN_TRACKER_BASE_ID, "Scoreboard", clientAccounts);
    } catch (error) {
        console.log("ERROR - index.js ---", error);
    }
})();
