const isThisWeek = require("date-fns/isThisWeek");

const Airtable = require("./src/Airtable");
const _ = require("./src/Helpers");

const LEAD_GEN_TRACKER = "appGB7S9Wknu6MiQb";

(async () => {
    try {
        let hotLeads = await Airtable.recordsInView("appCmYSLLMqsVtuur", "Prospects", "Hot Leads");

        hotLeads = hotLeads.filter((lead) => isThisWeek(new Date(lead["Response Date"])));

        console.log(hotLeads.length);
    } catch (error) {
        console.log("ERROR - prospectsLeft() ---", error);

        return false;
    }
})();
