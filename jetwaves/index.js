/**
 * Created by jetwaves on 2017/12/31.
 */
"use strict";
var fs = require('fs');
var async = require('async');
var moment = require('moment');
var Promise = require('promise');
var mysql = require('mysql');

const readline = require('readline');
const process = require('process');
const os= require('os');


var tool = {
    importFromSQL  : importFromSqlWithStreamReader
};


// var dbConnection = { host: 'localhost'       , user: 'root'  , password: '123456'    , database: 'database_name'        };
function importFromSqlWithStreamReader(fileFullName, dbConnectOptions, targetDbName){
    console.log('           dbConnectOptions  = ');  console.dir(dbConnectOptions);
    console.log(moment().format('Y/MM/DD HH:mm:ss\t\t\t\t')+__filename);console.log('\tINFO:\tStarting Import from file: '+fileFullName );
    return new Promise(function(resolve, reject) {
        //================================ Prepare Import: ========================================
        //  Connect to Database
        dbConnectOptions.database = targetDbName;
        var connection = mysql.createConnection(dbConnectOptions);
        connection.connect();

        console.log(moment().format('Y/MM/DD HH:mm:ss\t\t\t\t')+__filename);console.log('\tINFO:\tConnected to MySQL DB successfully ');
        try{
            var startImportTs = '';
            var endImportTs = '';
            startImportTs = moment().format('x');
            var cnt = 0;
            const rl = readline.createInterface({
                input: fs.createReadStream(fileFullName)
            });

            const END_OF_SQL = 'END OF SQL EXPORT';         // a signal to tell the importer that we have reached the end of the SQL scripts.
            var endOfSqlNotFound = true;
            var singleSql = '';
            var sqlToExecute = '';
            var sqlList = Array();
            var precedentSqlList = Array();
            rl.on('line', function(line){
                cnt = cnt + 1;
                var leftChar = line.substr(0,2);
                if(leftChar == '--'  || line.length < 5 || line.substr(0,4) == 'LOCK' || line.substr(0,4) == 'UNLO') return true;
                // When there are views definitions in the dump, we will execute the SQL without dbUser option like " DEFINER=`root`@`localhost` SQL SECURITY ..."
                if(line.indexOf('DEFINER=') > 0) line = '';

                // ============ black magic options for Aliyun RDS ====================
                //if( line.substring(0,18) == '/*!50001 DROP VIEW' || line.substring(0,28) == '/*!50001 CREATE TABLE `view_' ){
                //    line = line.substring(9);           // 去掉前面的  /*!50001
                //}
                //if(line.substring(0,3) != '/*!' && line.substr(-3) == '*/;'){
                //    line = line.substr(0, line.length - 3 ) + ';';        // 去掉view 创建时候  ) ENGINE=MyISAM */;    中的  */,  注意保留行尾分号因为这是一条语句的结尾
                //}
                // console.log('Line' + cnt  +  ' from file : ', line);


                var lastChar = line.substr(-1);
                singleSql = singleSql != '' ? singleSql + os.EOL + line : line;
                if(lastChar == ';') {
                    //console.log('           found SQL statement   singleSql = ' ); console.dir(singleSql)
                    sqlList.push(singleSql);
                    singleSql = '';
                    if( sqlList.length >=20 ) {
                        rl.pause();                 // The SQLcommand Queue stocks maximum 20 commands
                    }
                }
            }).on('pause',function(){
                //console.log('       ----- paused          sqlList.length  = ' + sqlList.length);
            }).on('resume',function(){          // Continue when the SQL command queue is empty.
                //console.log('       +++++ resumed ');
            }).on('close',function(){
                // Terminate the async's whilst loop
                console.log(moment().format('Y/MM/DD HH:mm:ss\t\t\t\t')+__filename);console.log('\tINFO:\tTotal lines imported : '+cnt );
                sqlList.push(END_OF_SQL);
            });

            var globalCount = 0;
            async.whilst(
                function () {
                    return endOfSqlNotFound;
                },
                function (callback) {
                    if(sqlList.length > 0){
                        var executedSQL = 0;
                        async.whilst(
                            function(){
                                // Prompt at every 100 commands executed. To avoid annoying waiting time.
                                if(globalCount % 100 == 0 && globalCount != 0){
                                    console.log(' ==== PROCESSING SQL IMPORT:  ' + globalCount + ' queries executed =====');
                                }
                                return (sqlList.length > 0);
                            },
                            function(callbackQuery){
                                sqlToExecute= sqlList.shift();
                                if(sqlToExecute == END_OF_SQL ){
                                    console.log(moment().format('Y/MM/DD HH:mm:ss\t\t\t\t')+__filename);
                                    console.log('\tINFO:\t'+ 'found end of SQL at cnt ' + cnt + '     total line Count = ' + globalCount );
                                    endOfSqlNotFound = false;
                                    callbackQuery(null, 2);
                                    return;
                                }
                                //var queryStartTs = moment().format('x');
                                connection.query(sqlToExecute, function (errQuery, rows, fields) {
                                    if (errQuery) {
                                        console.log('           errQuery  message = ');  console.dir(errQuery);
                                        console.log('!!!!  Error Occurs at query ' + executedSQL + '    Query = ');
                                        console.dir(sqlToExecute);
                                        throw errQuery;
                                    } else {
                                        executedSQL = executedSQL + 1;
                                        globalCount = globalCount + 1;
                                    }
                                    callbackQuery(null, 1);
                                });
                            },
                            function(errQueryList, result){
                                if(errQueryList){
                                    console.log('           errQueryList  msg = ');  console.dir(errQueryList);
                                    throw errQueryList;
                                }
                                precedentSqlList = sqlList;
                                sqlList = Array();
                                // Finished executing SQL commands in the Queue, resume the "feeder"(stream reader)
                                rl.resume();
                                callback(null, 1);
                            }
                        );
                    } else {
                        setTimeout(function(){
                            callback(null, 1);      // Here you may have a little rest, my little mysql server.
                        },100);
                    }
                },
                function (err, result) {
                    if(err){
                        console.log(' ERROR:  Result:  cnt = ' + cnt + '    err = '); console.dir(err);
                        connection.destroy();
                        process.exit(-1);
                    }
                    endImportTs = moment().format('x');
                    var timeElapse = { startImportTs: startImportTs, endImportTs: endImportTs, timeElapsed :  -( startImportTs.valueOf() - endImportTs.valueOf()) + ' ms'};
                    console.log(moment().format('Y/MM/DD HH:mm:ss\t\t\t\t')+__filename);
                    console.log('\tINFO:\tImport SQL file Ended successfully');
                    console.log('┏---- INFO: ----- start [timeElapse] -----');console.dir(timeElapse);console.log('┗---- INFO: -----  end  [timeElapse] -----')
                    connection.destroy();
                    resolve(globalCount);
                }
            );
        }catch( e){
            console.log('   ERROR!!!  Got Exception while executing SQL statements cnt = ' + cnt  + ' Error Message = ');  console.dir(e);
            connection.destroy();
            return reject({result: false, count : cnt, msg: {err: e } });
        }
    });
}


module.exports = tool;









