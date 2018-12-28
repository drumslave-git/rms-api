var express = require('express');
var router = express.Router();
var escape = require('pg-escape');

const sqls = {
    components: `CREATE TABLE components
(
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    color varchar(100)
);
CREATE UNIQUE INDEX components_id_uindex ON components (id);
CREATE UNIQUE INDEX components_name_uindex ON components (name);`,
    catalog: `CREATE TABLE catalog
(
    id serial PRIMARY KEY NOT NULL,
    componentId int,
    parentId int,
    expanded bool DEFAULT false,
    "order" int DEFAULT 0
);
CREATE UNIQUE INDEX catalog_id_uindex ON catalog (id);`,
    relations: `CREATE TABLE relations
(
    id serial PRIMARY KEY NOT NULL,
    componentId int,
    parentId int,
    "order" int DEFAULT 0
);
CREATE UNIQUE INDEX relations_id_uindex ON relations (id);`
};

/* GET users listing. */
router.get('/:part/:drop?', function(req, res, next) {
    const part = req.params.part;
    const drop = req.params.drop || false;
    res.write(`<p>Checking table "${part}"</p>`);
    res.locals.connection.query("SELECT to_regclass('public.'||$1::cstring);", [part], (errCheck, resultCheck) => {
        if(!errCheck){
            if(resultCheck.rows && resultCheck.rows.length){
                const row = resultCheck.rows[0];
                if(row && row['to_regclass'] && !drop){
                    res.write('<p>Table exists</p>');
                    res.end();
                }else{
                    if(row && row['to_regclass'] && drop){
                        res.write('<p>Dropping table...</p>');
                        res.locals.connection.query(escape(`DROP TABLE ${part};`), (errDel, resultDel) => {
                            if(!errDel) {
                                res.write('<p>Dropped!</p>');
                                res.write('<p>Going to recreate...</p>');
                                res.locals.connection.query(sqls[part], (errAdd, resultAdd) => {
                                    if(!errAdd){
                                        res.write(JSON.stringify(resultAdd));
                                        res.write('<p>SUCCESS!!!</p>');
                                        res.end();
                                    }else{
                                        console.log(errAdd.stack);
                                        res.write(JSON.stringify(errAdd));
                                        res.end();
                                    }
                                })
                            }else{
                                console.log(errDel.stack);
                                res.write(JSON.stringify(errDel));
                                res.end();
                            }
                        })
                    }else{
                        res.write('<p>Table does not exist</p>');
                        res.write('<p>Going to add...</p>');
                        res.locals.connection.query(sqls[part], (errAdd, resultAdd) => {
                            if(!errAdd){
                                res.write(JSON.stringify(resultAdd));
                                res.write('<p>SUCCESS!!!</p>');
                                res.end();
                            }else{
                                console.log(errAdd.stack);
                                res.write(JSON.stringify(errAdd));
                                res.end();
                            }
                        })
                    }
                }
            }
        }else{
            console.log(errCheck.stack);
            res.write(JSON.stringify(errCheck));
            res.end();
        }
    })
});

module.exports = router;
