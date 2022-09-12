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
        // const test = clientAccounts.filter((acc) => acc.Client === "Built Right Roofing");
        // console.log(test);
    } catch (error) {
        console.log("ERROR - index.js ---", error);
    }
})();
