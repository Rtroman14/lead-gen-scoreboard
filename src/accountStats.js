const Airtable = require("./Airtable");
const isThisWeek = require("date-fns/isThisWeek");

module.exports = async (account) => {
    let view = "Text";
    if ("Tag" in account) {
        view = `Text - ${account.Tag}`;
    }

    try {
        const prospects = await Airtable.recordsInView(account["Base ID"], "Prospects", view);

        let hotLeads = await Airtable.recordsInView(account["Base ID"], "Prospects", "Hot Leads");

        if (account.Client === "Roper Roofing" || account.Client === "Eco Tec") {
            moreHotLeads = await Airtable.recordsInView(
                account["Base ID"],
                "Prospects",
                "In JobNimbus"
            );

            hotLeads = [...hotLeads, ...moreHotLeads];
        }

        if ("Tag" in account) {
            hotLeads = hotLeads.filter((lead) => lead.Tag === account.Tag);
        } else {
            hotLeads = hotLeads.filter((lead) => !("Tag" in lead));
        }

        hotLeads = hotLeads.filter((lead) => isThisWeek(new Date(lead["Response Date"])));

        return {
            id: account.recordID,
            account: account.Account,
            tag: account.Tag || "",
            prospects: prospects.length || 0,
            leads: hotLeads.length || 0,
        };
    } catch (error) {
        console.log("ERROR - prospectsLeft() ---", error);

        return false;
    }
};
