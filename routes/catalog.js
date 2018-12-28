var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.locals.connection.query('SELECT * FROM components ORDER BY id ASC;', (err, result) => {
        if (err) {
            console.error(err);
            res.json(err);
        }
        res.locals.connection.end();
        res.json(result)
    });
});

router.post('/', function(req, res, next) {
    const data = {name: req.body.name, color: req.body.color};
    res.locals.connection.query('INSERT INTO components(name, color) values($1, $2) RETURNING *;', [data.name, data.color], (err, result) => {
        if (err) {
            console.error(err);
            res.json(err);
        }
        res.locals.connection.end();
        res.json(result);
    });
});

router.put('/:id', function(req, res, next) {
    const id = req.params.id;
    const data = {name: req.body.name, color: req.body.color};
    res.locals.connection.query('UPDATE components SET name=($1), color=($2) WHERE id=($3);', [data.name, data.color, id], (err, result) => {
        if (err) {
            console.error(err);
            res.json(err);
        }
        res.locals.connection.end();
        res.json(result);
    });
});

router.delete('/:id', function(req, res, next) {
    const id = req.params.id;
    res.locals.connection.query('DELETE FROM components WHERE id=($1);', [id], (err, result) => {
        if (err) {
            console.error(err);
            res.json(err);
        }
        res.locals.connection.end();
        res.json(result);
    });
});

module.exports = router;
