var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(indexRouter);


app.post('/register', function (req, res) {
  console.log(req.body);
  var date = new Date();
  var time = (date.getHours() + ":" + date.getMinutes());

  var connection = require('./mySQL/connect');


  table = "user"; 
  var queryString = "INSERT INTO " + table + " (`username`, `password`, `time`) VALUES ('" + req.body.username + "', '" + req.body.password + "', '" + time + "');"
  connection.query(queryString);

  connection.query('SELECT * FROM `user`', function (error, results, fields) {
    if (error) {
        console.error('error connecting: ' + error.stack);
        return;
    }
    res.send(results);
  });
  
});

app.post('/newUser', function (req, res) {
  console.log(req.body);  
  var connection = require('./mySQL/connect');
  table = "people";
  days = [parseInt(req.body.monday), parseInt(req.body.tuesday), parseInt(req.body.wednesday), parseInt(req.body.thursday), parseInt(req.body.friday)];
  var queryString = "INSERT INTO " + table + " (`FirstName`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`) VALUES ('" + req.body.name + "', '" + days[0] + "', '" + days[1] + "', '" + days[2] + "', '" + days[3] + "', '" + days[4] + "');"
  connection.query(queryString);
  connection.query('SELECT * FROM ' + table, function (error, results, fields) {
    if (error) {
        console.error('error connecting: ' + error.stack);
        return;
    }
    res.redirect('displayInformation') // redirect to the admin page if successful
  });
});

app.post('/userLogin', function (req, res) {
  console.log(req.body);
  date = new Date();
  minute = date.getMinutes();
  if (minute.toString().length < 2) {
    minute = "0" + minute;
  } else {
    minute = date.getMinutes();
  }
  timeArrival = date.getHours() + ":" + minute;
  if (date.getHours() < 10) {
    timeDifference = 0;
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 00);
  } else {
    timeDifference = ((date.getHours()-10)*60) + (date.getMinutes());
  }
  var connection = require('./mySQL/connect');
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear(); // if i put the month within 1 line - it comes up as [month-1] + 1 at the end e.g. 51 for june

  connection.query("UPDATE `" + table + "` SET Absent = '0' WHERE `FirstName` = '"+ req.body.userLogging +"'");
  connection.query("UPDATE `" + table + "` SET Arrival = '" + timeArrival + "' WHERE `FirstName` = '"+ req.body.userLogging +"'");
  connection.query("UPDATE `" + table + "` SET MinutesLate = '" + timeDifference + "' WHERE `FirstName` = '"+ req.body.userLogging +"'");
  connection.query("UPDATE `" + table + "` SET Departure = ':' WHERE `FirstName` = '"+ req.body.userLogging +"'");
  res.redirect('attendance');
});

app.post('/userLogout', function (req, res) {
  date = new Date();
  minute = date.getMinutes();
  if (minute.toString().length < 2) {
    minute = "0" + minute;
  } else {
    minute = date.getMinutes();
  }
  timeDepart = date.getHours() + ":" + minute;
  
  var connection = require('./mySQL/connect');
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear(); // if i put the month within 1 line - it comes up as [month-1] + 1 at the end e.g. 51 for june

  connection.query("SELECT `Arrival` FROM `" + table + "` WHERE `FirstName` = '" + req.body.userLogging + "'", function(error, results, fields) {
    results = results[0];
    time = results.Arrival;
    hour = parseInt(time[0] + time[1]);
    minute = parseInt(time[3] + time[4]);

    date2 = new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour,minute,00);
    timeWorked = Math.round(((date.getTime() - date2.getTime())/ 1000) / 60);

    connection.query("UPDATE `" + table + "` SET Departure = '" + timeDepart + "' WHERE `FirstName` = '"+ req.body.userLogging +"'");
    connection.query("UPDATE `" + table + "` SET TimeWorked = '" + timeWorked + "' WHERE `FirstName` = '"+ req.body.userLogging +"'");
  }); 

  // UPDATE `13/6/2019` SET Arrival = '10:34' WHERE `FirstName` = 'Antriko'
  

  res.redirect('attendance');
});

app.post('/setAbsent', function (req, res) {
  console.log(req.body);
  var connection = require('./mySQL/connect');
  var date = new Date();
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear();

  connection.query("UPDATE `" + table + "` SET `Absent` = '1', `Arrival` = '00:00', `MinutesLate` = '0', `Departure` = '00:00', `TimeWorked` = '0' WHERE `FirstName` = '" + req.body.name + "'");
  connection.query("INSERT INTO `absent`(`FirstName`, `day`, `reason`) VALUES ('" + req.body.name + "', '" + table + "', '" + req.body.reason + "')")
  res.redirect('displayInformation');
});

app.post('/displayFromDate', function(req, res, next) {
  console.log(req.body);
  var connection = require('./mySQL/connect');
  db = [];
  people = [];

  Date.prototype.addDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
  };
  
  function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
      dateArray.push(currentDate)
      currentDate = currentDate.addDays(1);
    }
    return dateArray;
  };
  year1 = parseInt(req.body.date1[0] + req.body.date1[1] + req.body.date1[2] + req.body.date1[3]);
  month1 = parseInt(req.body.date1[5] + req.body.date1[6]);
  day1 = parseInt(req.body.date1[8] + req.body.date1[9]);

  year2 = parseInt(req.body.date2[0] + req.body.date2[1] + req.body.date2[2] + req.body.date2[3]);
  month2 = parseInt(req.body.date2[5] + req.body.date2[6]);
  day2 = parseInt(req.body.date2[8] + req.body.date2[9]);
  var dateArray = getDates(new Date(year1, month1, day1), new Date(year2,month2,day2));

  connection.query("SELECT * FROM `people`", function(err, res, fie) {
    people = res;
  });
  dates = [];
  connection.query("SHOW TABLES", function(error, results, fields) {
    console.log(results)
    for (n = 0; n < dateArray.length; n++) {
      dateYear = dateArray[n].getFullYear();
      dateMonth = dateArray[n].getMonth();
      dateDay = dateArray[n].getDate();
      date = dateDay + "/" + dateMonth + "/" + dateYear;
      for (i = 0; i < results.length; i++) {
        if (results[i].Tables_in_users == date) {
          dates.push(date);
        }
      }
    }

    for (i = 0; i < dates.length; i++) {
      var getDB = connection.query("SELECT * FROM `" + dates[i] + "`", function(error, info, fields) {
        db.push(info);
      });
    };
    getDB.on('end', function() {        // Once query is complete
      console.log(db);
      console.log(people);
      console.log(dates);
      res.render('displayInformation', {
        data: db,
        people: people,
        dates: dates
      });
    });
  });
});

app.post("/customSet", function(req, res, next) {
  console.log(req.body);
  var connection = require('./mySQL/connect');
  date = new Date()
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear();

  if (req.body.Arrival == '1') {
    console.log("arrival")
    tmp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), (req.body.time[0] + req.body.time[1]), (req.body.time[3] + req.body.time[4]));
    if (tmp.getHours() < 10) {
      timeDifference = 0;
      tmp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 00);
      req.body.time = "10:00"
    } else {
      timeDifference = ((tmp.getHours()-10)*60) + (tmp.getMinutes());
    }

    connection.query("UPDATE `" + table + "` SET Absent = '0' WHERE `FirstName` = '"+ req.body.userLogging +"'");
    connection.query("UPDATE `" + table + "` SET Arrival = '" + req.body.time + "' WHERE `FirstName` = '"+ req.body.name +"'");
    connection.query("UPDATE `" + table + "` SET MinutesLate = '" + timeDifference + "' WHERE `FirstName` = '"+ req.body.name +"'");
    // see if there was already a departure - update that if so
    connection.query("SELECT `Departure` FROM `"+ table +"` WHERE `FirstName` = '" + req.body.name +"'", function(err, result) {
      result = result[0]; // it shows up as an array for some reason
      if (result == "+" || result == ":") {
        connection.query("UPDATE `" + table + "` SET Departure = ':' WHERE `FirstName` = '"+ req.body.name +"'");
      } else {
        req.body.time = result.Departure;
        tmp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), (req.body.time[0] + req.body.time[1]), (req.body.time[3] + req.body.time[4]));

        connection.query("SELECT `Arrival` FROM `" + table + "` WHERE `FirstName` = '" + req.body.name + "'", function(error, results, fields) {
          results = results[0];
          time = results.Arrival;
          hour = parseInt(time[0] + time[1]);
          minute = parseInt(time[3] + time[4]);

          date2 = new Date(tmp.getFullYear(),tmp.getMonth(),tmp.getDate(),hour,minute,00);
          timeWorked = Math.round(((tmp.getTime() - date2.getTime())/ 1000) / 60);
          console.log(timeWorked);

          connection.query("UPDATE `" + table + "` SET Departure = '" + req.body.time + "' WHERE `FirstName` = '"+ req.body.name +"'");
          connection.query("UPDATE `" + table + "` SET TimeWorked = '" + timeWorked + "' WHERE `FirstName` = '"+ req.body.name +"'");
        }); 
      }
    });


  }
  if (req.body.Departure == '1') {
    console.log("departure")
    tmp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), (req.body.time[0] + req.body.time[1]), (req.body.time[3] + req.body.time[4]));

    connection.query("SELECT `Arrival` FROM `" + table + "` WHERE `FirstName` = '" + req.body.name + "'", function(error, results, fields) {
      results = results[0];
      time = results.Arrival;
      hour = parseInt(time[0] + time[1]);
      minute = parseInt(time[3] + time[4]);

      date2 = new Date(tmp.getFullYear(),tmp.getMonth(),tmp.getDate(),hour,minute,00);
      timeWorked = Math.round(((tmp.getTime() - date2.getTime())/ 1000) / 60);
      console.log(timeWorked);

      connection.query("UPDATE `" + table + "` SET Departure = '" + req.body.time + "' WHERE `FirstName` = '"+ req.body.name +"'");
      connection.query("UPDATE `" + table + "` SET TimeWorked = '" + timeWorked + "' WHERE `FirstName` = '"+ req.body.name +"'");
    }); 

  }
  res.redirect('attendance');
});


app.post("/setHoliday", function(req, res, next) {
  console.log(req.body);
  var connection = require('./mySQL/connect');

  day = parseInt(req.body.date[8] + req.body.date[9]);
  month = parseInt(req.body.date[5] + req.body.date[6]);
  year = req.body.date[0] + req.body.date[1] + req.body.date[2] + req.body.date[3];
  date = day + "/" + month + "/" + year;

  console.log(date);
  connection.query("SELECT * FROM `holiday` WHERE `FirstName` = '" + req.body.name + "'", function(error, holidays) {
    console.log(holidays.length);
    if (holidays.length < 14) {
      connection.query("INSERT INTO `holiday`(`FirstName`, `day`) VALUES ('" + req.body.name + "', '" + date + "')");
    };
  });
  res.redirect('displayInformation');
});


app.post("/endDay", function (req, res, next) {
  console.log(req.body);
  var connection = require('./mySQL/connect');
  var date = new Date();
  month = parseInt(date.getMonth()) + 1;
  var table = date.getDate() + "/" + month + "/" + date.getFullYear(); // if i put the month within 1 line - it comes up as [month-1] + 1 at the end e.g. 51 for june

  one = connection.query("SELECT `FirstName` FROM `" + table + "` WHERE `Departure` = ':'", function (err, result) {
    x=0;
    for (i = 0; i < result.length; i++) {
      connection.query("SELECT `Arrival` FROM `" + table + "` WHERE `FirstName` = '" + result[i].FirstName + "'", function(error, results, fields) {
        results = results[0];
        time = results.Arrival;
        hour = parseInt(time[0] + time[1]);
        minute = parseInt(time[3] + time[4]);
        date = new Date(date.getFullYear(),date.getMonth(),date.getDate(),18,00,00);
        date2 = new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour,minute,00);
        timeWorked = Math.round(((date.getTime() - date2.getTime())/ 1000) / 60);
        connection.query("UPDATE `" + table + "` SET Departure = '" + req.body.time + "' WHERE `FirstName` = '"+ result[x].FirstName +"'");
        connection.query("UPDATE `" + table + "` SET TimeWorked = '" + timeWorked + "' WHERE `FirstName` = '"+ result[x].FirstName +"'");
        x++
      });
    };
  });

  connection.query("SELECT `FirstName` FROM `" + table + "` WHERE `Arrival` = '-'", function (err, absent) {
    for (i=0; i< absent.length; i++) {
      connection.query("UPDATE `" + table + "` SET `Absent` = '1' WHERE `FirstName` = '" + absent[i].FirstName + "'");
      connection.query("UPDATE `" + table + "` SET `Absent` = '1', `Arrival` = '00:00', `MinutesLate` = '0', `Departure` = '00:00', `TimeWorked` = '0' WHERE `FirstName` = '" + absent[i].FirstName + "'");
    }
  });

  res.redirect('displayInformation');
});


app.post('/adminLogin', function (req, res) {
  var connection = require('./mySQL/connect');
  var cookie = require('cookie');
  success = false;
  pass = connection.query("SELECT * FROM `admin`", function(err, result) {
    for (i=0; i<result.length; i++) {
      if (result[i].password == req.body.password) {
        success = true;
      };
    };
  });
  pass.on('end', function() {
    if (success == true) {
      ses = cookie.parse("session=true");
      res.redirect('displayInformation');
    } else {
      res.redirect('attendance');
    }
  });
});

app.post('/vistaLogin', function (req, res) {
  var connection = require('./mySQL/connect');
  var cookie = require('cookie');
  
  console.log(req.body);
  console.log("date: " + vista.date);
  if (req.body.type == "0") {
    connection.query("UPDATE `" + vista.date + "` SET Absent = '1' WHERE `FirstName` = '" + req.body.user + "'");
  } else {
    //
    timeArrive = "10:00";
    timeDepart = "16:00";
    
    if (req.body.type == "2") {
      timeArrive = req.body.time;
    }
    tmp = new Date();
    hour = parseInt(timeDepart[0] + timeDepart[1]);
    minute = parseInt(timeDepart[3] + timeDepart[4]);
    date = new Date(tmp.getFullYear(),tmp.getMonth(),tmp.getDate(),hour,minute,00);
    minute = date.getMinutes();
    if (minute.toString().length < 2) {
      minute = "0" + minute;
    } else {
      minute = date.getMinutes();
    }

    
    month = parseInt(date.getMonth()) + 1;

    hour = parseInt(timeArrive[0] + timeArrive[1]);
    minute = parseInt(timeArrive[3] + timeArrive[4]);

    date2 = new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour,minute,00);
    timeWorked = Math.round(((date.getTime() - date2.getTime())/ 1000) / 60);

    console.log(timeWorked);
    connection.query("UPDATE `" + vista.date + "` SET Arrival = '" + timeArrive + "' WHERE `FirstName` = '" + req.body.user + "'");
    connection.query("UPDATE `" + vista.date + "` SET Departure = '" + timeDepart + "' WHERE `FirstName` = '" + req.body.user + "'");
    connection.query("UPDATE `" + vista.date + "` SET TimeWorked = '" + timeWorked + "' WHERE `FirstName` = '" + req.body.user + "'");

    //
  };


  if (ses.session == "true") {
    one = connection.query("SELECT * FROM `" + vista.date + "` WHERE `Absent` = '3'", function (error, result, field) {
      res.render('vista', {
        db: result,
        date: req.body.date
      })
    })
  } else {
    res.redirect('attendance');
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;


// CREATE TABLE `date` (ID int NOT NULL, FirstName varchar(255), PRIMARY KEY (ID));

// ALTER TABLE `antriko` ADD COLUMN `11/06` VARCHAR(255) AFTER ID;
// ALTER TABLE `table` ADD COLUMN `current date` VARCHAR(255) AFTER ID;  // will add a new day

// CREATE TABLE `11/06` (ID int NOT NULL, FirstName varchar(255), Arrival varchar(255), MinutesLate varchar(255), PRIMARY KEY (ID));
// CREATE TABLE `people` (FirstName varchar(255), monday BOOLEAN, tuesday BOOLEAN, wednesday BOOLEAN, thursday BOOLEAN, friday BOOLEAN);
// INSERT INTO `people`(`FirstName`, `monday`, `tuesday`, `wednesday`, `thusday`, `friday`) VALUES ("Antriko",False,True,True,True,False);


// Absent
// 0  No
// 1  Yes - no reason
// 2  Yes - Holiday
// Anything else (the reason) - has reason as to why
