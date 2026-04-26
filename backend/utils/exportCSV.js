const { Parser } = require('json2csv');

const convertToCSV = (data, fields) => {
    const parser = new Parser({ fields });
    return parser.parse(data);
};

module.exports = { convertToCSV };
