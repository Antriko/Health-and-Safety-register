var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  
  res.redirect('attendance')
});

/* GO to user form where a new user will be added*/
router.use('/userForm', function(req, res, next) {
  res.render('userForm');
});
router.use('/attendance', function(req, res, next) {
  var connection = require('../mySQL/connect');
  var cookie = require('cookie');
  try {
  if (ses.session != "true") {
    ses = cookie.parse("session=false");
  } } catch {
    ses = cookie.parse("session=false");
  }
  table = "people"; 
  
  // init tables
  connection.query("CREATE TABLE IF NOT EXISTS `absent` (FirstName varchar(255), day varchar(255), reason varchar(255))", function(err, res, fie) {});
  connection.query("CREATE TABLE IF NOT EXISTS `holiday` (FirstName varchar(255), day varchar(255))", function(err, res, fie) {});
  connection.query("CREATE TABLE IF NOT EXISTS `people` (FirstName varchar(255), monday varchar(255), tuesday varchar(255), wednesday varchar(255), thursday varchar(255), friday varchar(255))", function(err, res, fie) {});
  connection.query("CREATE TABLE IF NOT EXISTS `admin` (password varchar(255))", function(err, admin, fie) {
    if (admin.warningCount == 0) {
      connection.query("INSERT INTO `admin` (`password`) VALUES ('password')")
    }
  });

  var date = new Date();
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear(); // if i put the month within 1 line - it comes up as [month-1] + 1 at the end e.g. 51 for june
  
  
  connection.query("CREATE TABLE IF NOT EXISTS`" + table + "`(FirstName varchar(255), Absent varchar(255), Arrival varchar(255), MinutesLate varchar(255), Departure varchar(255), TimeWorked varchar(255), Date varchar(255));", function(err, result, fie) {
    if (result.warningCount == 0) {
      days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      connection.query("SELECT `FirstName` FROM `people` WHERE `" + days[date.getDay()] +"` = 1;", function(error, results, fields) {
        for (i = 0; i < results.length; i++) {
          connection.query("INSERT INTO `" + table + "`(`FirstName`,`Absent`, `Arrival`, `MinutesLate`, `Departure`, `TimeWorked`, `Date`) VALUES (" + JSON.stringify(results[i].FirstName) + ", '_', '-', '=', '+', '/', '" + table + "')");
        }
      });
      connection.query("SELECT `FirstName` FROM `people` WHERE `" + days[date.getDay()] +"` = 2;", function(error, vistaRes, fields) {
        for (ix = 0; ix < vistaRes.length; ix++) {
          connection.query("INSERT INTO `" + table + "`(`FirstName`,`Absent`, `Arrival`, `MinutesLate`, `Departure`, `TimeWorked`, `Date`) VALUES (" + JSON.stringify(vistaRes[ix].FirstName) + ", '3', '00:00', '0', '00:00', '0', '" + table + "')"); // Admin will set their attendance within the next day
        }
      });
    };
    connection.query("SELECT `FirstName` FROM `holiday` WHERE `day` = '" + table + "'", function(err, res, fie) {
      for (i=0;i<res.length;i++) {
        connection.query("UPDATE `" + table + "` SET `Absent`='2',`Arrival`='10:00',`MinutesLate`='0',`Departure`='18:00',`TimeWorked`='480' WHERE `FirstName` = '" +res[i].FirstName + "'")
      ;}
    });
    connection.query("SELECT * FROM `" + table + "`", function(error, results, fields) {
      res.render('attendance', {
        attendance: results
      });
    });
  });
  
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.use('/displayInformation', function(req, res, next) {
  var connection = require('../mySQL/connect');
  var cookie = require('cookie');
  db = [];
  people = [];
  try {
    if (ses.session == "true") {
      connection.query("SELECT * FROM `people`", function(err, res, fie) {
        people = res;
      });
      connection.query("SELECT table_name FROM information_schema.tables where TABLE_SCHEMA ='users' and table_type='BASE TABLE' Order by create_time desc", function(error, results, fields) {
        
        resultDates = [];
        for (i = 0; i < results.length; i++) {
          if (isNaN((results[i].table_name)[0]) == false){
            resultDates.push(results[i].table_name);
          }
        };


        for (i = 0; i < resultDates.length; i++) {
          var getDB = connection.query("SELECT * FROM `" + resultDates[i] + "`", function(error, info, fields) {
            db.push(info);
          });
        };
        getDB.on('end', function() {        // Once query is complete
          res.locals.people = people;
          res.render('displayInformation', {
            data: db,
            people: people,
            dates: resultDates
          });
        });
      });
    } else {
      res.redirect('attendance');
    }
  } catch {
    res.redirect('attendance');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// DEV THINGS


router.use('/adminLogout', function (req, res) {
  var cookie = require('cookie');
  ses = cookie.serialize("session=false");
  res.redirect('attendance');
});

router.use('/resetDatabase', function (req, res) {
  console.log("resetting database")
  var connection = require('../mySQL/connect');
  var date = new Date();
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear(); // if i put the month within 1 line - it comes up as [month-1] + 1 at the end e.g. 51 for june

  connection.query("DROP TABLE `" + table + "`", function(error, results, fields) {
    console.log("database reset complete")
  })
  res.redirect('attendance');
});

router.use('/setVista', function (req, res) {
  var connection = require('../mySQL/connect');
  var cookie = require('cookie');
  console.log()
  if (ses.session == "true") {
    one = connection.query("SELECT * FROM `" + req.body.date + "` WHERE `Absent` = '3'", function (error, result, field) {
      console.log(result);
      res.render('vista', {
        db: result,
        date: req.body.date
      })
      vista = cookie.parse("date="+req.body.date)
    })
  } else {
    res.redirect('attendance');
  }
});

router.use('/artificialData', function (req, res) {
  var connection = require('../mySQL/connect');
  var date = new Date();
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear();

  timeDepart = "18:00";
  console.log(table);
  console.log("SELECT * FROM `" + table + "` WHERE `Absent` = '0'")
  o = connection.query("SELECT * FROM `" + table + "` WHERE `Absent` = '_'", function (error, result, field) {
    x=0;
    console.log(result);
    for (y=0;y<result.length;y++) {
      timeArrive = Math.floor(Math.random() * Math.floor(59));
      option = "";
      if (timeArrive.length == 1) {
        option = "0";
      }
      timeArrive = "10:"+option+timeArrive;
      

      tmp = new Date();

      hour = parseInt(timeDepart[0] + timeDepart[1]);
      minute = parseInt(timeDepart[3] + timeDepart[4]);
      date = new Date(tmp.getFullYear(),tmp.getMonth(),tmp.getDate(),hour,minute,00);


      hour = parseInt(timeArrive[0] + timeArrive[1]);
      minute = parseInt(timeArrive[3] + timeArrive[4]);
      date2 = new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour,minute,00);

      timeWorked = Math.round(((date.getTime() - date2.getTime())/ 1000) / 60);

      if (date2.getHours() < 10) {
        timeDifference = 0;
        date2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate(), 10, 00);
      } else {
        timeDifference = ((date2.getHours()-10)*60) + (date2.getMinutes());
      }
      connection.query("UPDATE `" + table + "` SET Absent = '0' WHERE `FirstName` = '" + result[x].FirstName + "'");
      connection.query("UPDATE `" + table + "` SET Arrival = '" + timeArrive + "' WHERE `FirstName` = '" + result[x].FirstName + "'");
      connection.query("UPDATE `" + table + "` SET MinutesLate = '" + timeDifference + "' WHERE `FirstName` = '"+ result[x].FirstName + "'");
      connection.query("UPDATE `" + table + "` SET Departure = '" + timeDepart + "' WHERE `FirstName` = '" + result[x].FirstName + "'");
      connection.query("UPDATE `" + table + "` SET TimeWorked = '" + timeWorked + "' WHERE `FirstName` = '" + result[x].FirstName + "'");
      x++;
    };
  });
  o.on("end", function() {
    res.redirect('attendance');
  })
});

module.exports = router;
