class Helpers {
    sortByKeyString(array, key) {
        return array.sort((a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0));
    }

    uniqueArrayOfObjects(arr, keyProps) {
        const kvArray = arr.map((entry) => {
            const key = keyProps.map((k) => entry[k]).join("|");
            return [key, entry];
        });
        const map = new Map(kvArray);
        return Array.from(map.values());
    }
}

module.exports = new Helpers();
