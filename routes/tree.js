var express = require('express');
var router = express.Router();
var escape = require('pg-escape');
const async = require('async');
function list_to_tree(list) {
    var map = {}, node, roots = [], i;
    for (i = 0; i < list.length; i += 1) {
        map[list[i].id] = i; // initialize the map
        list[i].children = []; // initialize the children
    }
    for (i = 0; i < list.length; i += 1) {
        node = list[i];
        if (node.parentid) {
            // if you have dangling branches check that map[node.parentId] exists
            list[map[node.parentid]].children.push(node);
        } else {
            roots.push(node);
        }
    }
    return roots;
}
function flatten(treeObj, idAttr, parentAttr, childrenAttr, levelAttr) {
    if (!idAttr) idAttr = 'id';
    if (!parentAttr) parentAttr = 'parent';
    if (!childrenAttr) childrenAttr = 'children';
    if (!levelAttr) levelAttr = 'level';

    function flattenChild(childObj, parentId, level) {
        var array = [];

        var childCopy = {...childObj};
        childCopy[levelAttr] = level;
        childCopy[parentAttr] = parentId;
        delete childCopy[childrenAttr];
        array.push(childCopy);

        array = array.concat(processChildren(childObj, level));

        return array;
    };

    function processChildren(obj, level) {
        if (!level) level = 0;
        var array = [];
        if(Array.isArray(obj[childrenAttr])) {
            obj[childrenAttr].forEach(function (childObj) {
                array = array.concat(flattenChild(childObj, obj[idAttr], level + 1));
            });
        }
        return array;
    };

    var result = processChildren(treeObj);
    return result;
};
router.get('/', function(req, res, next) {
    res.locals.connection.query('SELECT name, color, components.id as componentid, parentid, catalog.id as id, expanded, catalog.order as "order" FROM components LEFT JOIN catalog ON componentid = components.id ORDER BY catalog.order;', (err, result) => {
        if(!err){
            if(result.rows && result.rowCount){
                const tree = list_to_tree(result.rows);
                res.json(tree);
            }else{
                res.json({error: 'empty'});
            }
        }else{
            console.log(err.stack);
            res.json(err);
        }
    });
});

router.post('/', function(req, res, next) {
    const data = req.body;
    const list = flatten({children:data}, 'id', 'parentid');
    // res.json(list);
    const queries = [];
    list.forEach((newItem, idx) => {
        let query = '';
        const {
            parentid = null,
            componentid = null,
            expanded = false,
        } = newItem;
        if(newItem.id){
            query = escape(`UPDATE catalog SET parentid=(${parentid}), componentid=(${componentid}), expanded=(${expanded}), "order"=(${idx}) WHERE id=(${newItem.id})`);
        }else{
            query = escape(`INSERT INTO catalog(parentid, componentid, expanded, "order") values(${parentid}, ${componentid}, ${expanded}, ${idx})`)
        }
        queries.push(query);
    });
    // res.json(queries);
    res.locals.connection.query('SELECT * FROM catalog;', (errCat, resultCat) => {
        if(!errCat){
            if(resultCat.rows && resultCat.rowCount){
                const oldCatalog = resultCat.rows;
                oldCatalog.forEach(oldItem => {
                    const newItem = list.find(i => i.id === oldItem.id);
                    if(!newItem){
                        const query = escape(`DELETE FROM catalog WHERE id=(${oldItem.id})`);
                        queries.push(query);
                    }
                })
            }
            // res.json(queries);
            async.forEach(queries,
                (q, callback) => {
                    res.locals.connection.query(q, callback)
                },
                (err) => {
                    if(err) {
                        console.log(err.stack);
                        res.json(err);
                    }else{
                        res.json({result: 'ok'});
                    }
                }
            );
        }else{
            console.log(errCat.stack);
            res.json(errCat);
        }
    });
});

module.exports = router;