# mysqlStreamImporter

A nodejs importer who uses a stream reader to import huge SQL dump scripts into MySQL database 


## 0. Installation:
`npm install -g mysql-stream-importer`

## 1. Exemple to use:

`$node cli -u root -p password -d database_file_name -s sql_file_name.sql`

## 2. A CLI has been added to facilitate usage:

`$simport -u root -p password -d database_file_name -s sql_file_name.sql`

------

## Here are console responses during the command running :

```javascript
2017/12/31 19:14:09                             \vhosts\mysqlStreamImporter\jetwaves\cli
┏---- INFO: ----- start [args] -----
{ s: 'sqlDumpFileName.sql',
  d: 'databaseName',
  p: 123456,
  u: 'root' }
┗---- INFO: -----  end  [args] -----
2017/12/31 19:14:09                             \vhosts\mysqlStreamImporter\jetwaves\cli
┏---- INFO: ----- start [dbConnection  001 ] -----
{ host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'databaseName' }
┗---- INFO: -----  end  [dbConnection] -----
2017/12/31 19:14:09                             \vhosts\mysqlStreamImporter\jetwaves\cli
        INFO:   filename = sqlDumpFileName.sql
2017/12/31 19:14:09                             \vhosts\mysqlStreamImporter\jetwaves\index.js
        INFO:   Starting Import from file: sqlDumpFileName.sql
2017/12/31 19:14:09                             \vhosts\mysqlStreamImporter\jetwaves\index.js
        INFO:   Connected to MySQL DB successfully
 ==== PROCESSING SQL IMPORT:  100 queries executed =====
 ==== PROCESSING SQL IMPORT:  200 queries executed =====
 ==== PROCESSING SQL IMPORT:  300 queries executed =====
2017/12/31 19:14:16                             \vhosts\mysqlStreamImporter\jetwaves\index.js
        INFO:   Total lines imported : 933
2017/12/31 19:14:16                             \vhosts\mysqlStreamImporter\jetwaves\index.js
        INFO:   found end of SQL at cnt 933     total line Count = 398
2017/12/31 19:14:16                             \vhosts\mysqlStreamImporter\jetwaves\index.js
        INFO:   Import SQL file Ended successfully
┏---- INFO: ----- start [timeElapse] -----
{ startImportTs: '1514718849455',
  endImportTs: '1514718856970',
  timeElapsed: '7515 ms' }
┗---- INFO: -----  end  [timeElapse] -----
   ---- LOG: \vhosts\mysqlStreamImporter\jetwaves\cli
        success  res   = 398
```

