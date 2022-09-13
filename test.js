const isThisWeek = require("date-fns/isThisWeek");

const Airtable = require("./src/Airtable");
const _ = require("./src/Helpers");

const LEAD_GEN_TRACKER = "appGB7S9Wknu6MiQb";

(async () => {
    try {
        const Scoreboard = await Airtable.allRecords(LEAD_GEN_TRACKER, "Scoreboard");

        console.log(Scoreboard.length);
    } catch (error) {
        console.log("ERROR - prospectsLeft() ---", error);

        return false;
    }
})();
