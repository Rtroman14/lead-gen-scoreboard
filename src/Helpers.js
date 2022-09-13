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

    arrayDifference = (newArray, array, key) =>
        newArray.filter(
            ({ [key]: value1 }) => !array.some(({ [key]: value2 }) => value2 === value1)
        );
}

module.exports = new Helpers();
