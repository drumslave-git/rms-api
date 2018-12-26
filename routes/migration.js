var express = require('express');
var router = express.Router();

const sqls = {
    components: `CREATE TABLE components
(
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    color varchar(100)
);
CREATE UNIQUE INDEX components_id_uindex ON components (id);
CREATE UNIQUE INDEX components_name_uindex ON components (name);`
};

/* GET users listing. */
router.get('/components', function(req, res, next) {
    res.write('<p>Checking table "components"</p>');
    res.locals.connection.query("SELECT to_regclass('public.components');", (errCheck, resultCheck) => {
        if(!errCheck){
            if(resultCheck.rows && resultCheck.rows.length){
                const row = resultCheck.rows[0];
                if(row && row['to_regclass']){
                    res.write('<p>Table exists</p>');
                    res.end();
                }else{
                    res.write('<p>Table does not exist</p>');
                    res.write('<p>Going to add...</p>');
                    res.locals.connection.query(sqls.components, (errAdd, resultAdd) => {
                        if(!errAdd){
                            res.write(JSON.stringify(resultAdd));
                            res.write('<p>SUCCESS!!!</p>');
                            res.end();
                        }else{
                            res.write(JSON.stringify(errAdd));
                            res.end();
                        }
                    })
                }
            }
        }else{
            res.write(JSON.stringify(errCheck));
            res.end();
        }
    })
});

module.exports = router;
