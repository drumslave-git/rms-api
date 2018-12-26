var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    const results = [];
    // SQL Query > Select Data
    /*res.locals.connection.query('SELECT * FROM components ORDER BY id ASC;', (err, result) => {
        console.log(err, result);
        res.locals.connection.end();
        res.json(result)
    });*/
    res.locals.connection.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, result) => {
        if (err) throw err;
        /*for (let row of result.rows) {
            out += JSON.stringify(row);
            // console.log(JSON.stringify(row));
        }*/
        res.locals.connection.end();
        res.json(result);
    });
});

module.exports = router;
