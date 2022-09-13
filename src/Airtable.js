require("dotenv").config();

const Airtable = require("airtable");

class AirtableApi {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error("Using Airtable requires an API key.");
        }

        this.apiKey = apiKey;
    }

    async config(baseID) {
        try {
            return new Airtable({ apiKey: this.apiKey }).base(baseID);
        } catch (error) {
            console.log("NO API KEY PROVIDED ---", error);
        }
    }

    async updateRecord(baseID, recordID, updatedFields) {
        try {
            const base = await this.config(baseID);

            await base("Scoreboard").update(recordID, updatedFields);
        } catch (error) {
            console.log("ERROR updateRecord() ---", error);
        }
    }

    async deleteRecords(baseID, arrayOfRecordIDs) {
        try {
            const base = await this.config(baseID);

            const res = await base("Scoreboard").destroy(arrayOfRecordIDs);

            return res;
        } catch (error) {
            console.log("ERROR deleteRecords() ---", error);

            return false;
        }
    }

    async createRecords(baseID, table, records) {
        try {
            const base = await this.config(baseID);

            const res = await base(table).create(records);

            const accounts = res.map((record) => ({ ...record.fields, recordID: record.id }));

            return accounts;
        } catch (error) {
            console.log("ERROR createRecords() ---", error);
            return false;
        }
    }

    async recordsInView(baseID, table, view) {
        try {
            const base = await this.config(baseID);

            const res = await base(table).select({ view }).all();

            const contacts = res.map((contact) => {
                return {
                    ...contact.fields,
                    recordID: contact.getId(),
                };
            });

            return contacts;
        } catch (error) {
            console.log(`ERROR recordsInView(${baseID}) --- ${error}`);
            return [];
        }
    }

    async allRecords(baseID, table) {
        try {
            const base = await this.config(baseID);

            const res = await base(table).select().all();

            const contacts = res.map((contact) => {
                return {
                    ...contact.fields,
                    recordID: contact.getId(),
                };
            });

            return contacts;
        } catch (error) {
            console.log(`ERROR allRecords(${baseID}) --- ${error}`);
            return [];
        }
    }

    async batchUpload(baseID, table, records) {
        let allRecords = [];

        try {
            const batchAmount = 10;
            const iterations = Math.ceil(records.length / batchAmount);

            for (let batch = 1; batch <= iterations; batch++) {
                // get first 10 contacts
                let tenRecords = records.slice(0, batchAmount);
                // remove first 10 contacts from array
                records = records.slice(batchAmount);

                const createdRecords = await this.createRecords(baseID, table, tenRecords);

                // code for errors
                if (!createdRecords) return false;

                allRecords = [...allRecords, ...createdRecords];
            }

            return allRecords;
        } catch (error) {
            console.log("ERROR batchUpload() ---", error);
            return [];
        }
    }

    async batchDelete(baseID, arrayOfRecordIDs) {
        try {
            const batchAmount = 10;
            const iterations = Math.ceil(arrayOfRecordIDs.length / batchAmount);

            for (let batch = 1; batch <= iterations; batch++) {
                // get first 10 contacts
                let tenRecordIDs = arrayOfRecordIDs.slice(0, batchAmount);
                // remove first 10 contacts from array
                arrayOfRecordIDs = arrayOfRecordIDs.slice(batchAmount);

                const deletedRecords = await this.deleteRecords(baseID, tenRecordIDs);

                // code for errors
                if (!deletedRecords) return false;
            }

            return true;
        } catch (error) {
            console.log("ERROR batchUpload() ---", error);
            return false;
        }
    }

    formatRecord = (record) => ({ fields: { ...record } });
    formatRecords = (records) => records.map((record) => ({ fields: { ...record } }));
}

module.exports = new AirtableApi(process.env.AIRTABLE_API_KEY);
