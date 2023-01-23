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

        if (
            account.Client === "Roper Roofing" ||
            account.Client === "Eco Tec" ||
            account.Client === "Integrity Pro Roofing"
        ) {
            const inJobNimbusLeads = await Airtable.recordsInView(
                account["Base ID"],
                "Prospects",
                "In JobNimbus"
            );

            hotLeads = [...hotLeads, ...inJobNimbusLeads];
        }

        if ("Tag" in account) {
            hotLeads = hotLeads.filter((lead) => lead.Tag === account.Tag);
        } else {
            hotLeads = hotLeads.filter((lead) => !("Tag" in lead));
        }

        hotLeads = hotLeads.filter((lead) => isThisWeek(new Date(lead["Response Date"])));

        return {
            id: account.recordID,
            baseID: account["Base ID"],
            client: account.Client,
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
