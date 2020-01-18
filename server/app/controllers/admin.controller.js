'use strict';

require('rootpath')();
var model_admin = require('server/app/models/admin.model');
var model_user = require('server/app/models/user.model');
var model_pass = require('server/app/models/pass.model');
var model_purchase = require('server/app/models/purchase.model');
var model_history = require('server/app/models/history.model');
var model_admin_history = require('server/app/models/admin_history.model');
var model_gear = require('server/app/models/gear.model');
var model_feedback = require('server/app/models/feedback.model');
var model_qrcode = require('server/app/models/qrcode.model');
var model_equipment = require('server/app/models/equipment.model');

var auth = require('server/app/controllers/authentication.controller');
var service = require('server/app/controllers/service.controller');
var dateFormat = require('dateformat');
var path = require('path');
var stringify = require('csv-stringify');
var fs = require('fs');

var Json2csvParser = require('json2csv').Parser;


var admin = this;
admin.socket = null;
admin.pending_length = 0;

var env_config = require('server/config/development');
var stripe = require('stripe')(env_config.stripe_apiKey);
var md5 = require('md5');
var moment = require('moment');

var callback_count;
var admin_name = "";
var purchase_itmes;
var customer_id = 0;
var schedule_count = 0;

var pass_updated_count = 0;
var users = [];
var current_day = "";
var passes = [];

var checkout_passes = [];
var force_checkout_count = 0;


exports.createsocket = function () {
    var express = require('express');
    var app = express();
    var io = require('socket.io').listen(app.listen(3500));
    io.on('connection', function (socket) {
        admin.socket = socket;
        socket.on('retrieve_length', function (data) {
            socket.emit('pending_length', data);
            socket.broadcast.emit('pending_length', data);
        });
    });
}

exports.validate_staff = function (req, res) {
    model_admin.findOne({ user_token: req.body.user_token }, function (err, result) {
        if (result == null) {
            return res.status(200).json({
                result: -1
            });
        }
        // if(new Date().getTime() - result.signin_time > 10800000)
        // {
        //     return res.status(200).json({
        //         result: -1     
        //     });
        // }
        return res.status(200).json({
            result: 1
        });
    });
}

exports.validate_qr = function (req, res) {

    console.log("requesting hexcode:", req.query.hexcode);

    var decimalcode = parseInt(req.query.hexcode, 16);

    console.log("decimal code:", decimalcode);

    model_qrcode.findOne({ decimalcode: decimalcode }, function (err, result) {
        if (!result) {

            console.log("no validated qrcode");
            return res.status(200).json({
                result: 0
            });
        }

        var response = JSON.parse(result.detail);

        console.log("validate_qr_response:", response);

        model_pass.findOne({ user_id: response.user_id, pass_type: response.pass_type }, function (err, result) {
            if (err) {
                return res.status(500).send({ message: err.message });
            }

            if (response.status == "in") {
                var updateData = {
                    user_id: result.user_id,
                    pass_type: result.pass_type,
                    from: result.from,
                    to: result.to,
                    status: "in",
                    remain_count: result.remain_count
                };

                console.log("phone timestamp ", response.timestamp);

                console.log("server timestamp ", new Date().getTime());

                var user_update = {
                    last_visit: new Date().toDateString() + " " + new Date().toTimeString().split(' ')[0]
                }

                console.log("user_update", user_update);

                model_user.findOneAndUpdate({ _id: response.user_id }, { $set: user_update }, { new: true }, function (err, user) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }

                    model_pass.findOneAndUpdate({ user_id: response.user_id, pass_type: response.pass_type }, { $set: updateData }, { new: true }, function (err, user) {
                        if (err) {
                            return res.status(500).send({ message: err.message });
                        }
                        model_history.aggregate(
                            {
                                $match: {
                                    user_id: response.user_id
                                }
                            },

                            function (err, result) {
                                if (result.length == 0) {
                                    var detail = [];

                                    var history_timestamp = new Date().getTime();

                                    var temp = {
                                        status: response.status,
                                        // timestamp: response.timestamp,
                                        timestamp: history_timestamp,
                                        pass_type: response.pass_type,
                                        decimalcode: decimalcode,
                                        action: "System"
                                    }

                                    detail.push(temp);

                                    var history = new model_history(
                                        {
                                            user_id: response.user_id,
                                            timestamp: history_timestamp,
                                            detail: detail
                                        }
                                    );

                                    history.save(function (err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        var status_data = {
                                            flag: true
                                        }
                                        if (admin.socket != undefined) {
                                            admin.socket.emit("status_checkout", status_data);
                                            admin.socket.broadcast.emit("status_checkout", status_data);

                                        }

                                        return res.status(200).json({
                                            result: 1
                                        });
                                    });

                                    try {
                                        // model_qrcode.findOneAndRemove({"hexcode": '2beaf8'});
                                        model_qrcode.find({ hexcode: result.hexcode }).remove().exec();
                                    } catch (e) {
                                        console.log(e);
                                    }

                                }
                                else {
                                    var flag = false;
                                    for (var i = 0; i < result.length; i++) {
                                        if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(response.timestamp / env_config.timeofday)) {
                                            flag = true;
                                        }
                                    }

                                    if (flag == false) {
                                        var detail = [];

                                        var history_timestamp = new Date().getTime();

                                        var temp = {
                                            status: response.status,
                                            // timestamp: response.timestamp,
                                            timestamp: history_timestamp,
                                            pass_type: response.pass_type,
                                            decimalcode: decimalcode,
                                            action: "System"
                                        }

                                        detail.push(temp);

                                        var history = new model_history(
                                            {
                                                user_id: response.user_id,
                                                // timestamp: response.timestamp,
                                                timestamp: history_timestamp,
                                                detail: detail
                                            }
                                        );

                                        history.save(function (err, result) {
                                            if (err) {
                                                return res.status(500).send({ message: err.message });
                                            }
                                            var status_data = {
                                                flag: true
                                            }
                                            admin.socket.emit("status_checkout", status_data);
                                            admin.socket.broadcast.emit("status_checkout", status_data);
                                            return res.status(200).json({
                                                result: 1
                                            });
                                        });

                                        try {
                                            // model_qrcode.findOneAndRemove({"hexcode": '2beaf8'});
                                            model_qrcode.find({ hexcode: result.hexcode }).remove().exec();
                                        } catch (e) {
                                            console.log(e);
                                        }
                                    }
                                    else {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(response.timestamp / env_config.timeofday)) {
                                                var history_timestamp = new Date().getTime();

                                                var temp = {
                                                    status: response.status,
                                                    // timestamp: response.timestamp,
                                                    timestamp: history_timestamp,
                                                    pass_type: response.pass_type,
                                                    decimalcode: decimalcode,
                                                    action: "System"
                                                }

                                                result[i].detail.push(temp);

                                                model_history.findOneAndUpdate({ user_id: response.user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    var status_data = {
                                                        flag: true
                                                    }
                                                    admin.socket.emit("status_checkout", status_data);
                                                    admin.socket.broadcast.emit("status_checkout", status_data);
                                                    return res.status(200).json({
                                                        result: 1
                                                    });
                                                });

                                                try {
                                                    // model_qrcode.findOneAndRemove({"hexcode": '2beaf8'});
                                                    model_qrcode.find({ hexcode: result.hexcode }).remove().exec();
                                                } catch (e) {
                                                    console.log(e);
                                                }

                                            }
                                        }
                                    }
                                }
                            }
                        );
                    });
                });
            }

            else {

                if (response.pass_type == "season") {
                    if (response.status == "out") {
                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: 1
                        };
                    }
                }
                else if (response.pass_type == "promo") {
                    if (response.status == "out") {
                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: 0
                        };
                    }
                }
                else if (response.pass_type == "multi") {
                    if (response.status == "out") {


                        var flag = false;
                        for (var i = 0; i < result.out_dayPass.length; i++) {
                            if (Math.floor(result.out_dayPass[i] / env_config.timeofday) == Math.floor(response.timestamp / env_config.timeofday))
                                flag = true;
                        }


                        if (flag == false) {
                            result.out_dayPass = [];
                            result.out_dayPass.push(response.timestamp);
                            result.remain_count--;
                        }


                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: result.remain_count,
                            out_dayPass: result.out_dayPass
                        };
                    }
                }
                else if (response.pass_type == "day") {
                    if (response.status == "out") {

                        var flag = false;
                        for (var i = 0; i < result.out_dayPass.length; i++) {
                            if (Math.floor(result.out_dayPass[i] / env_config.timeofday) == Math.floor(response.timestamp / env_config.timeofday))
                                flag = true;
                        }

                        if (flag == false) {
                            result.out_dayPass = [];
                            result.out_dayPass.push(response.timestamp);
                            result.remain_count--;
                        }

                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: result.remain_count,
                            out_dayPass: result.out_dayPass
                        };
                    }
                }

                model_pass.findOneAndUpdate({ user_id: response.user_id, pass_type: response.pass_type }, { $set: updateData }, { new: true }, function (err, user) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }
                    model_history.aggregate(
                        {
                            $match: {
                                user_id: response.user_id
                            }
                        },

                        function (err, result) {
                            if (result.length == 0) {
                                var detail = [];

                                var history_timestamp = new Date().getTime();

                                var temp = {
                                    status: response.status,
                                    // timestamp: response.timestamp,
                                    timestamp: history_timestamp,
                                    pass_type: response.pass_type,
                                    decimalcode: decimalcode,
                                    action: "System"
                                }

                                detail.push(temp);

                                var history = new model_history(
                                    {
                                        user_id: response.user_id,
                                        timestamp: history_timestamp,
                                        detail: detail
                                    }
                                );

                                history.save(function (err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    var status_data = {
                                        flag: true
                                    }
                                    admin.socket.emit("status_checkout", status_data);
                                    admin.socket.broadcast.emit("status_checkout", status_data);

                                    return res.status(200).json({
                                        result: 1
                                    });
                                });

                                try {
                                    // model_qrcode.findOneAndRemove({"hexcode": '2beaf8'});
                                    model_qrcode.find({ hexcode: result.hexcode }).remove().exec();
                                } catch (e) {
                                    console.log(e);
                                }

                            }
                            else {
                                var flag = false;
                                for (var i = 0; i < result.length; i++) {
                                    if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(response.timestamp / env_config.timeofday)) {
                                        flag = true;
                                    }
                                }

                                if (flag == false) {
                                    var detail = [];

                                    var history_timestamp = new Date().getTime();

                                    var temp = {
                                        status: response.status,
                                        // timestamp: response.timestamp,
                                        timestamp: history_timestamp,
                                        pass_type: response.pass_type,
                                        decimalcode: decimalcode,
                                        action: "System"
                                    }

                                    detail.push(temp);

                                    var history = new model_history(
                                        {
                                            user_id: response.user_id,
                                            // timestamp: response.timestamp,
                                            timestamp: history_timestamp,
                                            detail: detail
                                        }
                                    );

                                    history.save(function (err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        var status_data = {
                                            flag: true
                                        }
                                        admin.socket.emit("status_checkout", status_data);
                                        admin.socket.broadcast.emit("status_checkout", status_data);
                                        return res.status(200).json({
                                            result: 1
                                        });
                                    });

                                    try {
                                        // model_qrcode.findOneAndRemove({"hexcode": '2beaf8'});
                                        model_qrcode.find({ hexcode: result.hexcode }).remove().exec();
                                    } catch (e) {
                                        console.log(e);
                                    }
                                }
                                else {
                                    for (var i = 0; i < result.length; i++) {
                                        if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(response.timestamp / env_config.timeofday)) {
                                            var history_timestamp = new Date().getTime();

                                            var temp = {
                                                status: response.status,
                                                // timestamp: response.timestamp,
                                                timestamp: history_timestamp,
                                                pass_type: response.pass_type,
                                                decimalcode: decimalcode,
                                                action: "System"
                                            }

                                            result[i].detail.push(temp);

                                            model_history.findOneAndUpdate({ user_id: response.user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                var status_data = {
                                                    flag: true
                                                }
                                                if (admin.socket != undefined) {
                                                    admin.socket.emit("status_checkout", status_data);
                                                    admin.socket.broadcast.emit("status_checkout", status_data);
                                                }

                                                return res.status(200).json({
                                                    result: 1
                                                });
                                            });

                                            try {
                                                // model_qrcode.findOneAndRemove({"hexcode": '2beaf8'});
                                                model_qrcode.find({ hexcode: result.hexcode }).remove().exec();
                                            } catch (e) {
                                                console.log(e);
                                            }

                                        }
                                    }
                                }
                            }
                        }
                    );
                });
            }

        });
    });
}


exports.admin_users = function (req, res) {
    model_admin.find({ user_token: req.body.user_token }, function (err, result) {
        if (result.length == 0) {
            return res.status(200).json({
                result: -1
            });
        }

        // if(new Date().getTime() - result.signin_time > 10800000)
        // {
        //     return res.status(200).json({
        //         result: -1     
        //     });
        // }

        else {
            model_admin.find({}, function (err, result) {
                if (result.length == 0) {
                    return res.status(200).json({
                        result: -1
                    });
                }
                var users = [];
                for (var i = 0; i < result.length; i++) {
                    var temp = {
                        id: i + 1,
                        user_id: result[i].id,
                        name: result[i].name,
                        user_name: result[i].user_name,
                        user_email: result[i].user_email,
                        role: result[i].role,
                        edit: false
                    }
                    users.push(temp);
                }
                return res.status(200).json({
                    result: 1,
                    users: users
                });
            });

        }

    }
    );
}

exports.adduser = function (req, res) {
    var admin = new model_admin({
        name: req.body.userInfo.name,
        user_name: req.body.userInfo.user_name,
        user_password: md5(req.body.userInfo.user_password),
        user_email: req.body.userInfo.user_email,
        role: req.body.userInfo.role,
        user_token: service.token_generator()
    });

    admin.save(function (err, result) {
        if (err) {
            console.log("admin save error!");
            return;
        }
        return res.status(200).json({
            result: 1
        });
        console.log("admin save success!")
    });
}

exports.admin_update_users = function (req, res) {

    model_admin.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }
        for (var i = 0; i < result.length; i++) {
            var flag = false;
            for (var j = 0; j < req.body.userInfo.length; j++) {
                if (result[i].user_name == req.body.userInfo[j].user_name) {
                    flag = true;
                }
            }

            if (flag == false)
                model_admin.find({ user_name: result[i].user_name }).remove().exec();

        }

        for (var i = 0; i < req.body.userInfo.length; i++) {
            if (req.body.userInfo[i].user_password == undefined || req.body.userInfo[i].user_password == "") {
                var updateData = {
                    user_name: req.body.userInfo[i].user_name,
                    user_email: req.body.userInfo[i].user_email,
                    role: req.body.userInfo[i].role,
                }
            }

            else {
                var updateData = {
                    user_name: req.body.userInfo[i].user_name,
                    user_password: md5(req.body.userInfo[i].user_password)
                }
            }

            model_admin.findOneAndUpdate({ _id: req.body.userInfo[i].user_id }, { $set: updateData }, { new: true }, function (err, user) {
                if (err) {
                    return res.status(500).send({ message: err.message });
                }
            });

        }
        return res.status(200).json({
            result: 1
        });

    });


}

exports.admin_signin = function (req, res) {

    model_admin.findOne({ user_password: md5(req.body.password) }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1
            });
        }
        else {
            if (req.body.email == "" || req.body.email == undefined) {
                var service = require('server/app/controllers/service.controller');
                var updateData = {
                    user_token: service.token_generator(),
                    signin_time: new Date().getTime(),
                }
                model_admin.findOneAndUpdate({ user_email: result.user_email }, { $set: updateData }, { new: true }, function (err, user) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }
                    return res.status(200).json({
                        result: 1,
                        user: {
                            name: user.name,
                            user_name: user.user_name,
                            user_email: user.user_email,
                            user_password: user.user_password,
                            user_token: user.user_token,
                            user_avatar: user.user_avatar,
                            role: user.role
                        }
                    });
                });
            }
            else {
                if (req.body.email == result.user_email || req.body.email == result.user_name) {
                    var service = require('server/app/controllers/service.controller');
                    var updateData = {
                        user_token: service.token_generator(),
                        signin_time: new Date().getTime(),
                    }
                    model_admin.findOneAndUpdate({ user_password: md5(req.body.password) }, { $set: updateData }, { new: true }, function (err, user) {
                        if (err) {
                            return res.status(500).send({ message: err.message });
                        }
                        return res.status(200).json({
                            result: 1,
                            user: {
                                name: user.name,
                                user_name: user.user_name,
                                user_email: user.user_email,
                                user_password: user.user_password,
                                user_token: user.user_token,
                                user_avatar: user.user_avatar,
                                role: user.role
                            }
                        });
                    });
                }
                else
                    return res.status(200).json({
                        result: 0
                    });
            }


        }

    }
    );


}

exports.admin_home_getuser = function (req, res) {
    model_user.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }
        var customerInfo = result;

        var live_count = 0;
        var visit_to_date = 0;
        var customers = [];

        model_pass.find({}, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            for (var i = 0; i < result.length; i++) {
                if (result[i].status == "in") {
                    live_count++;
                    for (var j = 0; j < customerInfo.length; j++) {
                        if (customerInfo[j].id == result[i].user_id && customerInfo[j].nric_passNumber != "") {
                            var personal = [];
                            var temp;

                            temp = {
                                type: "NAME:",
                                value: customerInfo[j].firstName + " " + customerInfo[j].familyName
                            }
                            personal.push(temp);

                            temp = {
                                type: "DATE OF BIRTH:",
                                value: customerInfo[j].birthDate
                            }
                            personal.push(temp);

                            temp = {
                                type: "AGE:",
                                value: parseInt(new Date().getFullYear() - new Date(customerInfo[j]).getFullYear())
                            }
                            personal.push(temp);

                            temp = {
                                type: "PHONE NUMBER:",
                                value: customerInfo[j].user_phoneNumber
                            }
                            personal.push(temp);

                            temp = {
                                type: "LAST VISIT:",
                                value: (customerInfo[j].last_visit == '') ? "NA" : customerInfo[j].last_visit
                            }
                            personal.push(temp);

                            if (customerInfo[j].emergency_phoneNumber == "") {
                                temp = {
                                    type: "GUARDIAN CONTACT:",
                                    value: customerInfo[j].guardian_phoneNumber
                                }
                                personal.push(temp);
                            }

                            else {
                                temp = {
                                    type: "EMERGENCY CONTACT:",
                                    value: customerInfo[j].emergency_phoneNumber
                                }
                                personal.push(temp);
                            }

                            var temp_phoneNumber = customerInfo[j].user_phoneNumber.slice(1, customerInfo[j].user_phoneNumber.length);
                            var temp = {
                                user_name: customerInfo[j].firstName + " " + customerInfo[j].familyName,
                                avatar_url: env_config.server_url + customerInfo[j].picture_avatar,
                                phone_number: temp_phoneNumber,
                                detail: personal
                            }
                            customers.push(temp);
                        }

                    }

                }

            }
            model_history.find({}, function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }
                else {
                    var user_id = "";
                    for (var i = 0; i < result.length; i++) {

                        for (var j = 0; j < result[i].detail.length; j++) {
                            if (result[i].detail[j].status == "in" && (Math.floor(result[i].detail[j].timestamp / env_config.timeofday) == Math.floor(new Date().getTime() / env_config.timeofday))) {
                                if (user_id != result[i].user_id) {
                                    user_id = result[i].user_id;
                                    visit_to_date++;
                                }

                            }

                        }
                    }
                    return res.status(200).json({
                        result: 1,
                        customers: customers,
                        live_count: live_count,
                        visit_to_date: visit_to_date
                    });
                }
            }
            );

        });
    });
}

exports.admin_search_getuser = function (req, res) {
    model_user.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }
        var live_count = 0;
        var visit_to_date = 0;
        var customers = [];
        for (var i = 0; i < result.length; i++) {
            if (result[i].nric_passNumber != "") {
                var personal = [];
                var temp;

                temp = {
                    type: "NAME:",
                    value: result[i].firstName + " " + result[i].familyName
                }
                personal.push(temp);

                temp = {
                    type: "DATE OF BIRTH:",
                    value: result[i].birthDate
                }
                personal.push(temp);

                let age = 0;
                if (new Date().getFullYear() > new Date(result[i].birthDate).getFullYear()) {
                    if (new Date().getMonth() == new Date(result[i].birthDate).getMonth()) {
                        if (new Date().getDay() > new Date(result[i].birthDate).getDay())
                            age = parseInt(new Date().getFullYear() - new Date(result[i].birthDate).getFullYear());
                        else
                            age = parseInt(new Date().getFullYear() - new Date(result[i].birthDate).getFullYear() - 1);
                    }
                    else if (new Date().getMonth() > new Date(result[i].birthDate).getMonth())
                        age = parseInt(new Date().getFullYear() - new Date(result[i].birthDate).getFullYear());
                    else
                        age = parseInt(new Date().getFullYear() - new Date(result[i].birthDate).getFullYear() - 1);
                }

                temp = {
                    type: "AGE:",
                    value: age
                }
                personal.push(temp);

                temp = {
                    type: "PHONE NUMBER:",
                    value: result[i].user_phoneNumber
                }
                personal.push(temp);

                temp = {
                    type: "REGISTRATION TIME:",
                    src: result[i].signup_stamp,
                    value: new Date(result[i].signup_stamp).toDateString() + " " + new Date(result[i].signup_stamp).toTimeString().split(' ')[0]
                }
                personal.push(temp);


                temp = {
                    type: "LAST VISIT:",
                    src: new Date(result[i].last_visit).getTime(),
                    value: (result[i].last_visit == '') ? "NA" : result[i].last_visit
                }
                personal.push(temp);

                if (result[i].emergency_phoneNumber == "") {
                    temp = {
                        type: "GUARDIAN CONTACT:",
                        value: result[i].guardian_phoneNumber
                    }
                    personal.push(temp);
                }

                else {
                    temp = {
                        type: "EMERGENCY CONTACT:",
                        value: result[i].emergency_phoneNumber
                    }
                    personal.push(temp);
                }

                var temp_phoneNumber = result[i].user_phoneNumber.slice(1, result[i].user_phoneNumber.length);
                var temp = {
                    user_name: result[i].firstName + " " + result[i].familyName,
                    avatar_url: env_config.server_url + result[i].picture_avatar,
                    phone_number: temp_phoneNumber,
                    detail: personal
                }
                customers.push(temp);
            }

            customers.sort(function (a, b) {
                var data_A = a.detail[5].src;
                var data_B = b.detail[5].src;
                if (data_A > data_B)
                    return -1;
                if (data_A < data_B)
                    return 1;
                return 0;
            });

        }
        model_pass.find({}, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            for (var i = 0; i < result.length; i++) {
                if (result[i].status == "in")
                    live_count++;
            }
            model_history.find({}, function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }
                else {
                    for (var i = 0; i < result.length; i++) {

                        for (var j = 0; j < result[i].detail.length; j++) {
                            if (result[i].detail[j].status == "in" && (Math.floor(result[i].detail[j].timestamp / env_config.timeofday) == Math.floor(new Date().getTime() / env_config.timeofday))) {
                                visit_to_date++;
                            }

                        }
                    }
                    return res.status(200).json({
                        result: 1,
                        customers: customers,
                        live_count: live_count,
                        visit_to_date: visit_to_date
                    });
                }
            }
            );

        });
    });
}


exports.admin_validate_phone_number = function (req, res) {
    var phone_number;
    if (req.body.customer_phone_number.indexOf('+') >= 0)
        phone_number = req.body.customer_phone_number;
    else
        phone_number = '+' + req.body.customer_phone_number

    model_user.findOne({ user_phoneNumber: phone_number }, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }
        if (!result) {
            return res.status(200).json({
                result: 0,
            });
        }
        var send_phoneNumber = result.user_phoneNumber.slice(1, result.user_phoneNumber.length);
        return res.status(200).json({
            result: 1,
            user_avatar: env_config.server_url + result.picture_avatar,
            name: result.firstName + " " + result.familyName,
            phone_number: send_phoneNumber
        });
    });

}

exports.admin_getCustomerInfo = function (req, res) {

    model_user.findOne({ user_phoneNumber: ("+" + req.body.customer_phone_number) }, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }
        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        var avatar_url = env_config.server_url + result.picture_avatar;

        var stripe_customer_id = result.stripe_customerid;
        var stripe_subscription_id = result.stripe_subscriptionid;

        var personal = [];
        var temp;

        temp = {
            type: "NAME:",
            value: result.firstName + " " + result.familyName
        }
        personal.push(temp);

        temp = {
            type: "NRIC:",
            value: result.nric_passNumber
        }
        personal.push(temp);

        temp = {
            type: "DOB:",
            value: result.birthDate
        }
        personal.push(temp);

        temp = {
            type: "GENDER:",
            value: result.gender
        }
        personal.push(temp);

        temp = {
            type: "MOBILE:",
            value: result.user_phoneNumber
        }
        personal.push(temp);

        temp = {
            type: "EMAIL:",
            value: result.user_email
        }
        personal.push(temp);

        temp = {
            type: "ADDRESS:",
            value: result.user_address
        }
        personal.push(temp);

        var emergency = [];

        temp = {
            type: "NAME:",
            value: (result.emergency_name == "") ? result.guardian_name : result.emergency_name
        }
        emergency.push(temp);

        temp = {
            type: "CONTACT:",
            value: (result.emergency_phoneNumber == "") ? result.guardian_phoneNumber : result.emergency_phoneNumber
        }
        emergency.push(temp);

        temp = {
            type: "RELATIONSHIP:",
            value: (result.emergency_relationship == "") ? result.guardian_relationship : result.emergency_relationship
        }
        emergency.push(temp);

        var special_note = result.special_note;
        var qualification = [
            {
                type: "NSCS Level 1",
                message: '',
                checked: false
            },
            {
                type: "NSCS Level 2",
                message: '',
                checked: false
            },
            {
                type: "NSCS Level 3",
                message: '',
                checked: false
            },
            {
                type: "ABD Belay Tag",
                message: '',
                checked: false
            },
            {
                type: "ABD Lead Tag",
                message: '',
                checked: false
            },
            {
                type: "Others:",
                message: "",
                checked: false,
            },
        ];

        for (var i = 0; i < result.qualification.length; i++) {
            var including = false;
            for (var j = 0; j < qualification.length; j++) {
                if (result.qualification[i] == qualification[j].type) {
                    including = true;
                    qualification[j].checked = true;
                }

            }
            if (including == false) {
                qualification[qualification.length - 1].message = result.qualification[i];
                qualification[qualification.length - 1].checked = true;
            }

        }

        var transaction_history = [];

        var customer_id = result.id;

        var pdf_url = env_config.server_url + result.pdf_url;

        model_admin_history.find({ customer_id: customer_id }, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            for (var i = 0; i < result.length; i++) {

                var temp = {
                    id: transaction_history.length + 1,
                    type: result[i].type,
                    date_time: result[i].date_time,
                    action: (result[i].action == undefined) ? "System" : result[i].action,
                    notes: ''
                }
                transaction_history.push(temp);

            }
            model_purchase.aggregate(
                {
                    $match: {
                        user_id: customer_id
                    }
                },
                function (err, result) {
                    if (err) {
                        return res.status(200).json({
                            result: 0
                        });
                    }
                    for (var i = 0; i < result.length; i++) {
                        for (var j = 0; j < result[i].detail.length; j++) {
                            var temp = {
                                id: transaction_history.length + 1,
                                type: result[i].detail[j].message + " " + "purchase",
                                date_time: result[i].detail[j].timestamp,
                                action: (result[i].detail[j].action == undefined) ? "System" : result[i].detail[j].action,
                                notes: ''
                            }
                            transaction_history.push(temp);
                        }
                    }
                    model_history.aggregate(
                        {
                            $match: {
                                user_id: customer_id
                            }
                        },
                        function (err, result) {
                            if (err) {
                                return res.status(200).json({
                                    result: 0
                                });
                            }

                            var pass_check = [
                                {
                                    type: "season",
                                    in: 0,
                                    out: 0
                                },
                                {
                                    type: "promo",
                                    in: 0,
                                    out: 0
                                },
                                {
                                    type: "day",
                                    in: 0,
                                    out: 0
                                },
                                {
                                    type: "multi",
                                    in: 0,
                                    out: 0
                                }

                            ]


                            for (var i = 0; i < result.length; i++) {
                                for (var j = 0; j < result[i].detail.length; j++) {
                                    for (var k = 0; k < 4; k++) {
                                        if (pass_check[k].type == result[i].detail[j].pass_type) {
                                            if (result[i].detail[j].status == "in")
                                                pass_check[k].in++;
                                            if (result[i].detail[j].status == "out")
                                                pass_check[k].out++;
                                        }
                                    }
                                    var temp = {
                                        id: transaction_history.length + 1,
                                        type: ((result[i].detail[j].action == undefined || result[i].detail[j].action == "System") ? "Check-" : "Manual Check-") + result[i].detail[j].status + " (" + service.getFirstUpperString(result[i].detail[j].pass_type) + " Pass)",
                                        date_time: result[i].detail[j].timestamp,
                                        action: (result[i].detail[j].action == undefined) ? "System" : result[i].detail[j].action,
                                        notes: ''
                                    }
                                    transaction_history.push(temp);
                                }
                            }

                            transaction_history.sort(function (a, b) {
                                var data_A = a.date_time;
                                var data_B = b.date_time;
                                if (data_A > data_B)
                                    return -1;
                                if (data_A < data_B)
                                    return 1;
                                return 0;
                            });


                            var history = {
                                last_visit: "",
                                visit_month: 0,
                                transaction_history: transaction_history
                            }

                            var current_year = new Date().getFullYear();
                            var current_month = new Date().getMonth() + 1;

                            var month_first = new Date(current_year + "/" + current_month + "/1").getTime();
                            var month_last = new Date(current_year + "/" + (current_month + 1) + "/1").getTime();

                            var incount = 0;
                            var outcount = 0;
                            var status = "";

                            for (var i = 0; i < transaction_history.length; i++) {

                                if (transaction_history[i].type.indexOf("in") >= 0) {
                                    incount++;
                                    history.last_visit = new Date(transaction_history[i].date_time).toDateString();
                                    if (month_first <= transaction_history[i].date_time && transaction_history[i].date_time < month_last)
                                        history.visit_month++;
                                }
                                if (transaction_history[i].type.indexOf("out") >= 0) {
                                    outcount++;
                                }

                            }

                            for (var i = 0; i < history.transaction_history.length; i++) {
                                history.transaction_history[i].id = i + 1;
                                history.transaction_history[i].date_time = service.dateFormat(history.transaction_history[i].date_time)
                            }

                            if (incount > 0 && ((incount - outcount) == 1)) {
                                status = "in";
                            }


                            var checkin_passtype = "";

                            for (var k = 0; k < 4; k++) {
                                if (pass_check[k].in > 0 && (pass_check[k].in - pass_check[k].out) > 0) {
                                    checkin_passtype = pass_check[k].type;
                                }
                            }
                            var used_promo = false;
                            model_pass.findOne({ user_id: customer_id, pass_type: "promo" }, function (err, result) {
                                if (err) {
                                    return res.status(200).json({
                                        result: 0
                                    });
                                }
                                if (result == null)
                                    used_promo = false;
                                else
                                    used_promo = true;

                            });

                            auth.getAvailablePass_web(customer_id, function (available_pass) {
                                return res.status(200).json({
                                    result: 1,
                                    personal: personal,
                                    special_note: special_note,
                                    stripe_customer_id: stripe_customer_id,
                                    stripe_subscription_id: stripe_subscription_id,
                                    emergency: emergency,
                                    qualification: qualification,
                                    available_pass: available_pass,
                                    avatar_url: avatar_url,
                                    history: history,
                                    status: status,
                                    checkin_passtype: checkin_passtype,
                                    used_promo: used_promo,
                                    customer_id: customer_id,
                                    pdf_url: pdf_url
                                });
                            });
                        }
                    );
                }
            );
        });
    });

}

exports.admin_adddaypas_in = function (req, res) {
    model_admin.findOne({ user_token: req.body.user_token }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1
            });
        }
        else {
            var admin_name = result.name;
            model_user.findOne({ user_phoneNumber: "+" + req.body.customer_phone_number }, function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }
                if (!result) {
                    return res.status(200).json({
                        result: 0
                    });
                }

                var customer_id = result.id;

                model_pass.findOne({ user_id: customer_id, pass_type: req.body.pass_type }, function (err, result) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }

                    if (!result) {
                        var timestamp = new Date().getTime();

                        var pass = new model_pass({
                            user_id: customer_id,
                            pass_type: "day",
                            from: timestamp,
                            to: timestamp + 86400000 * 7,
                            remain_count: 1,
                            status: "in"
                        });

                        pass.save(function (err, result) {
                            if (err) {
                                console.log(err);
                            }
                            var admin_history = new model_admin_history({
                                type: "DAY PASS ADDED",
                                date_time: new Date().getTime(),
                                action: admin_name,
                                notes: '',
                                customer_id: customer_id
                            });
                            admin_history.save(function (err, result) {
                                if (err) {
                                    console.log(err);
                                }
                                model_history.aggregate(
                                    {
                                        $match: {
                                            user_id: customer_id
                                        }
                                    },

                                    function (err, result) {
                                        var timestamp = new Date().getTime();
                                        if (result.length == 0) {
                                            var detail = [];

                                            var temp = {
                                                status: "in",
                                                timestamp: timestamp,
                                                pass_type: "day",
                                                decimalcode: "",
                                                action: req.body.user_name
                                            }

                                            detail.push(temp);

                                            var history = new model_history(
                                                {
                                                    user_id: customer_id,
                                                    timestamp: timestamp,
                                                    detail: detail
                                                }
                                            );

                                            history.save(function (err, result) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                return res.status(200).json({
                                                    result: 1
                                                });
                                            })
                                        }
                                        else {
                                            var flag = false;
                                            for (var i = 0; i < result.length; i++) {
                                                if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {
                                                    flag = true;
                                                }
                                            }

                                            if (flag == false) {
                                                var detail = [];

                                                var temp = {
                                                    status: "in",
                                                    timestamp: timestamp,
                                                    pass_type: "day",
                                                    decimalcode: "",
                                                    action: req.body.user_name
                                                }

                                                detail.push(temp);

                                                var history = new model_history(
                                                    {
                                                        user_id: customer_id,
                                                        timestamp: timestamp,
                                                        detail: detail
                                                    }
                                                );

                                                history.save(function (err, result) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    return res.status(200).json({
                                                        result: 1
                                                    });
                                                });

                                            }
                                            else {
                                                for (var i = 0; i < result.length; i++) {
                                                    if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {

                                                        var temp = {
                                                            status: "in",
                                                            timestamp: timestamp,
                                                            pass_type: "day",
                                                            decimalcode: "",
                                                            action: req.body.user_name
                                                        }

                                                        result[i].detail.push(temp);

                                                        model_history.findOneAndUpdate({ user_id: customer_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            return res.status(200).json({
                                                                result: 1
                                                            });
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                );
                            });
                        });
                    }

                    else {
                        var timestamp = new Date().getTime();

                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: (result.from < timestamp) ? result.from : timestamp,
                            to: ((result.to > (timestamp + 86400000 * 7)) ? result.to : (timestamp + 86400000 * 7)),
                            status: "in",
                            remain_count: result.remain_count + 1
                        };

                        model_pass.findOneAndUpdate({ user_id: customer_id, pass_type: "day" }, { $set: updateData }, { new: true }, function (err, user) {
                            if (err) {
                                return res.status(500).send({ message: err.message });
                            }
                            var admin_history = new model_admin_history({
                                type: "DAY PASS ADDED",
                                date_time: new Date().getTime(),
                                action: admin_name,
                                notes: '',
                                customer_id: customer_id
                            });
                            admin_history.save(function (err, result) {
                                if (err) {
                                    console.log(err);
                                }

                                model_history.aggregate(
                                    {
                                        $match: {
                                            user_id: customer_id
                                        }
                                    },

                                    function (err, result) {
                                        var timestamp = new Date().getTime();
                                        if (result.length == 0) {
                                            var detail = [];

                                            var temp = {
                                                status: "in",
                                                timestamp: timestamp,
                                                pass_type: "day",
                                                decimalcode: "",
                                                action: req.body.user_name
                                            }

                                            detail.push(temp);

                                            var history = new model_history(
                                                {
                                                    user_id: customer_id,
                                                    timestamp: timestamp,
                                                    detail: detail
                                                }
                                            );

                                            history.save(function (err, result) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                return res.status(200).json({
                                                    result: 1
                                                });
                                            })
                                        }
                                        else {
                                            var flag = false;
                                            for (var i = 0; i < result.length; i++) {
                                                if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {
                                                    flag = true;
                                                }
                                            }

                                            if (flag == false) {
                                                var detail = [];

                                                var temp = {
                                                    status: "in",
                                                    timestamp: timestamp,
                                                    pass_type: "day",
                                                    decimalcode: "",
                                                    action: req.body.user_name
                                                }

                                                detail.push(temp);

                                                var history = new model_history(
                                                    {
                                                        user_id: customer_id,
                                                        timestamp: timestamp,
                                                        detail: detail
                                                    }
                                                );

                                                history.save(function (err, result) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    return res.status(200).json({
                                                        result: 1
                                                    });
                                                });

                                            }
                                            else {
                                                for (var i = 0; i < result.length; i++) {
                                                    if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {

                                                        var temp = {
                                                            status: "in",
                                                            timestamp: timestamp,
                                                            pass_type: "day",
                                                            decimalcode: "",
                                                            action: req.body.user_name
                                                        }

                                                        result[i].detail.push(temp);

                                                        model_history.findOneAndUpdate({ user_id: customer_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            return res.status(200).json({
                                                                result: 1
                                                            });
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                );
                            });

                        });
                    }
                });
            });
        }

    }
    );
}

exports.admin_gymin_inout = function (req, res) {
    if (req.body.status == "out") {
        model_user.findOne({ user_phoneNumber: "+" + req.body.customer_phone_number }, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            if (!result) {
                return res.status(200).json({
                    result: 0
                });
            }

            var customer_id = result.id;

            model_pass.findOne({ user_id: customer_id, pass_type: req.body.pass_type }, function (err, result) {
                if (err) {
                    return res.status(500).send({ message: err.message });
                }

                var timestamp = new Date().getTime();

                if (req.body.pass_type == "season") {
                    if (req.body.status == "out") {
                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: 1
                        };
                    }
                }

                else if (req.body.pass_type == "promo") {
                    if (req.body.status == "out") {
                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: 0
                        };
                    }
                }
                else if (req.body.pass_type == "multi") {
                    if (req.body.status == "out") {
                        // var updateData = {
                        //     user_id: result.user_id,
                        //     pass_type: result.pass_type,
                        //     from: result.from,
                        //     to: result.to,
                        //     status: "out",
                        //     remain_count: result.remain_count - 1
                        // };

                        var flag = false;
                        for (var i = 0; i < result.out_dayPass.length; i++) {
                            if (Math.floor(result.out_dayPass[i] / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                flag = true;
                        }
                        if (flag == false) {
                            if (result.out_dayPass.length > 0) {
                                result.out_dayPass = [];
                                result.out_dayPass.push(timestamp);
                                result.remain_count--;
                            }
                            else {
                                result.out_dayPass.push(timestamp);
                            }

                        }



                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: result.remain_count,
                            out_dayPass: result.out_dayPass
                        };
                    }
                }
                else if (req.body.pass_type == "day") {
                    if (req.body.status == "out") {

                        var flag = false;
                        for (var i = 0; i < result.out_dayPass.length; i++) {
                            if (Math.floor(result.out_dayPass[i] / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                flag = true;
                        }
                        if (flag == false) {
                            if (result.out_dayPass.length > 0) {
                                result.out_dayPass = [];
                                result.out_dayPass.push(timestamp);
                                result.remain_count--;
                            }
                            else {
                                result.out_dayPass.push(timestamp);
                            }

                        }

                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "out",
                            remain_count: result.remain_count,
                            out_dayPass: result.out_dayPass
                        };
                    }
                }


                model_pass.findOneAndUpdate({ user_id: customer_id, pass_type: req.body.pass_type }, { $set: updateData }, { new: true }, function (err, user) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }
                    model_history.aggregate(
                        {
                            $match: {
                                user_id: customer_id
                            }
                        },

                        function (err, result) {
                            var timestamp = new Date().getTime();
                            if (result.length == 0) {
                                var detail = [];

                                var temp = {
                                    status: req.body.status,
                                    timestamp: timestamp,
                                    pass_type: req.body.pass_type,
                                    decimalcode: "",
                                    action: req.body.user_name
                                }

                                detail.push(temp);

                                var history = new model_history(
                                    {
                                        user_id: customer_id,
                                        timestamp: timestamp,
                                        detail: detail
                                    }
                                );

                                history.save(function (err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    return res.status(200).json({
                                        result: 1
                                    });
                                })
                            }
                            else {
                                var flag = false;
                                for (var i = 0; i < result.length; i++) {
                                    if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {
                                        flag = true;
                                    }
                                }

                                if (flag == false) {
                                    var detail = [];

                                    var temp = {
                                        status: req.body.status,
                                        timestamp: timestamp,
                                        pass_type: req.body.pass_type,
                                        decimalcode: "",
                                        action: req.body.user_name
                                    }

                                    detail.push(temp);

                                    var history = new model_history(
                                        {
                                            user_id: customer_id,
                                            timestamp: timestamp,
                                            detail: detail
                                        }
                                    );

                                    history.save(function (err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        return res.status(200).json({
                                            result: 1
                                        });
                                    });

                                }
                                else {
                                    for (var i = 0; i < result.length; i++) {
                                        if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {

                                            var temp = {
                                                status: req.body.status,
                                                timestamp: timestamp,
                                                pass_type: req.body.pass_type,
                                                decimalcode: "",
                                                action: req.body.user_name
                                            }

                                            result[i].detail.push(temp);

                                            model_history.findOneAndUpdate({ user_id: customer_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                return res.status(200).json({
                                                    result: 1
                                                });
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    );
                });

            });
        });
    }

    else {

        model_user.findOne({ user_phoneNumber: "+" + req.body.customer_phone_number }, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            if (!result) {
                return res.status(200).json({
                    result: 0
                });
            }

            var customer_id = result.id;

            var updateData = {
                last_visit: new Date().toDateString() + " " + new Date().toTimeString().split(' ')[0]
            }

            model_user.findOneAndUpdate({ user_phoneNumber: "+" + req.body.customer_phone_number }, { $set: updateData }, { new: true }, function (err, user) {
                if (err) {
                    return res.status(500).send({ message: err.message });
                }

                model_pass.findOne({ user_id: customer_id, pass_type: req.body.pass_type }, function (err, result) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }

                    var timestamp = new Date().getTime();

                    if (req.body.status == "in") {
                        var updateData = {
                            user_id: result.user_id,
                            pass_type: result.pass_type,
                            from: result.from,
                            to: result.to,
                            status: "in",
                            remain_count: result.remain_count
                        };
                    }

                    model_pass.findOneAndUpdate({ user_id: customer_id, pass_type: req.body.pass_type }, { $set: updateData }, { new: true }, function (err, user) {
                        if (err) {
                            return res.status(500).send({ message: err.message });
                        }
                        model_history.aggregate(
                            {
                                $match: {
                                    user_id: customer_id
                                }
                            },

                            function (err, result) {
                                var timestamp = new Date().getTime();
                                if (result.length == 0) {
                                    var detail = [];

                                    var temp = {
                                        status: "in",
                                        timestamp: timestamp,
                                        pass_type: req.body.pass_type,
                                        decimalcode: "",
                                        action: req.body.user_name
                                    }

                                    detail.push(temp);

                                    var history = new model_history(
                                        {
                                            user_id: customer_id,
                                            timestamp: timestamp,
                                            detail: detail
                                        }
                                    );

                                    history.save(function (err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        return res.status(200).json({
                                            result: 1
                                        });
                                    })
                                }
                                else {
                                    var flag = false;
                                    for (var i = 0; i < result.length; i++) {
                                        if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {
                                            flag = true;
                                        }
                                    }

                                    if (flag == false) {
                                        var detail = [];

                                        var temp = {
                                            status: req.body.status,
                                            timestamp: timestamp,
                                            pass_type: req.body.pass_type,
                                            decimalcode: "",
                                            action: req.body.user_name
                                        }

                                        detail.push(temp);

                                        var history = new model_history(
                                            {
                                                user_id: customer_id,
                                                timestamp: timestamp,
                                                detail: detail
                                            }
                                        );

                                        history.save(function (err, result) {
                                            if (err) {
                                                return res.status(500).send({ message: err.message });
                                            }
                                            return res.status(200).json({
                                                result: 1
                                            });
                                        });

                                    }
                                    else {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {

                                                var temp = {
                                                    status: req.body.status,
                                                    timestamp: timestamp,
                                                    pass_type: req.body.pass_type,
                                                    decimalcode: "",
                                                    action: req.body.user_name
                                                }

                                                result[i].detail.push(temp);

                                                model_history.findOneAndUpdate({ user_id: customer_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    return res.status(200).json({
                                                        result: 1
                                                    });
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        );
                    });


                });

            });


        });

    }


}


exports.admin_customer_update = function (req, res) {
    // model_admin.findOne({ user_token: req.body.user_token }, function(err, result) 
    // {
    //     if(!result)
    //     {
    //         return res.status(200).json({
    //             result: -1     
    //         });
    //     }

    //     // if(new Date().getTime() - result.signin_time > 10800000)
    //     // {
    //     //     return res.status(200).json({
    //     //         result: -1     
    //     //     });
    //     // }


    // });

    var admin_name = "System";
    model_user.findOne({ _id: req.body.customerInfo.customer_id }, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }
        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        var guardian_flag = false;
        if (result.guardian_name == "") {
            guardian_flag = false;
        }
        else
            guardian_flag = true;

        var qualification = [];

        for (var i = 0; i < req.body.customerInfo.qualification.length - 1; i++) {
            if (req.body.customerInfo.qualification[i].checked == true)
                qualification.push(req.body.customerInfo.qualification[i].type);
        }
        if (req.body.customerInfo.qualification[req.body.customerInfo.qualification.length - 1].message != "" && req.body.customerInfo.qualification[req.body.customerInfo.qualification.length - 1].checked == true)
            qualification.push(req.body.customerInfo.qualification[req.body.customerInfo.qualification.length - 1].message);

        if (guardian_flag == false) {
            var updateData = {
                firstName: req.body.customerInfo.personal[0].value.split(' ')[0],
                familyName: req.body.customerInfo.personal[0].value.split(' ')[1],
                nric_passNumber: req.body.customerInfo.personal[1].value,
                birthDate: req.body.customerInfo.personal[2].value,
                gender: req.body.customerInfo.personal[3].value,
                user_phoneNumber: req.body.customerInfo.personal[4].value,
                user_email: req.body.customerInfo.personal[5].value,
                user_address: req.body.customerInfo.personal[6].value,
                guardian_name: req.body.customerInfo.emergency[0].value,
                guardian_phoneNumber: req.body.customerInfo.emergency[1].value,
                guardian_relationship: req.body.customerInfo.emergency[2].value,
                special_note: req.body.customerInfo.special_note,
                qualification: qualification,
                picture_avatar: req.body.customerInfo.avatar_url.replace(env_config.server_url, "")
            }
        }

        else {
            var updateData = {
                firstName: req.body.customerInfo.personal[0].value.split(' ')[0],
                familyName: req.body.customerInfo.personal[0].value.split(' ')[1],
                nric_passNumber: req.body.customerInfo.personal[1].value,
                birthDate: req.body.customerInfo.personal[2].value,
                gender: req.body.customerInfo.personal[3].value,
                user_phoneNumber: req.body.customerInfo.personal[4].value,
                user_email: req.body.customerInfo.personal[5].value,
                user_address: req.body.customerInfo.personal[6].value,
                emergency_name: req.body.customerInfo.emergency[0].value,
                emergency_phoneNumber: req.body.customerInfo.emergency[1].value,
                emergency_relationship: req.body.customerInfo.emergency[2].value,
                special_note: req.body.customerInfo.special_note,
                qualification: qualification,
                picture_avatar: req.body.customerInfo.avatar_url.replace(env_config.server_url, "")
            }
        }

        var customer_pass = req.body.customerInfo.available_pass;
        var customer_id = req.body.customerInfo.customer_id;
        model_user.findOneAndUpdate({ _id: req.body.customerInfo.customer_id }, { $set: updateData }, { new: true }, function (err, user) {
            if (err) {
                return res.status(500).send({ message: err.message });
            }
            pass_updated_count = 0;
            admin.customer_pass_update(customer_id, customer_pass, admin_name);
            return res.status(200).json({
                result: 1,
            });
        });

    });
}

exports.upload_image = function (req, res) {
    var fileName = service.imageName_generator();
    var file_path = path.join(__dirname + '../../../assets/image/upload/' + fileName);
    // var file_path = path.join(__dirname + '../../../assets/image/upload/' + req.body.file_name);

    var base64Data = req.body.content.replace(/^data:image\/png;base64,/, "");

    fs.writeFile(file_path, base64Data, 'base64', function (err) {
        if (err == null) {
            return res.status(200).json({
                result: 1,
                url: env_config.server_url + "/image/" + file_name
            });
        }
        else {
            return res.status(200).json({
                result: 0
            });
        }
    })
}

// exports.force_checkout = function()
// {
//     model_pass.find({}, function(err, result) {
//         if (err) {
//             console.log("message1:", err.message);
//         }

//         var timestamp = new Date().getTime();

//         for(var i = 0; i < result.length; i++)
//         {
//             var updateData = {};

//             if(result[i].status == "in")
//             {
//                 if(result[i].pass_type == "season")
//                 {
//                     updateData = {
//                         user_id: result[i].user_id,
//                         pass_type: result[i].pass_type,
//                         from: result[i].from,
//                         to: result[i].to,
//                         status: "out",
//                         remain_count: 1
//                     };
//                 }

//                 else if(result[i].pass_type == "promo")
//                 {
//                     updateData = {
//                         user_id: result[i].user_id,
//                         pass_type: result[i].pass_type,
//                         from: result[i].from,
//                         to: result[i].to,
//                         status: "out",
//                         remain_count: 0
//                     };   
//                 }
//                 else if(result[i].pass_type == "multi")
//                 {

//                     result[i].out_dayPass.push(timestamp);
//                     result[i].remain_count -= result[i].out_dayPass.length ;
//                     result[i].out_dayPass = [];                        

//                     // var flag = false;
//                     // for(var j = 0; j <  result[i].out_dayPass.length; j++)
//                     // {
//                     //     if(Math.floor(result[i].out_dayPass[j] / env_config.timeofday) ==  Math.floor(timestamp / env_config.timeofday))
//                     //         flag = true;
//                     // }

//                     // if(flag == false)
//                     // {
//                     //     result[i].out_dayPass.push(timestamp);
//                     //     result[i].remain_count -= result[i].out_dayPass.length ;
//                     //     result[i].out_dayPass = [];                        
//                     // }
//                     // if(flag == false)
//                     // {
//                     //     if(result[i].out_dayPass.length > 0)
//                     //     {
//                     //         result[i].out_dayPass = [];
//                     //         result[i].out_dayPass.push(timestamp);
//                     //         result[i].remain_count -- ;
//                     //     }
//                     //     else
//                     //     {
//                     //         result[i].out_dayPass.push(timestamp);
//                     //     }

//                     // }

//                     var updateData = {
//                         user_id: result[i].user_id,
//                         pass_type: result[i].pass_type,
//                         from: result[i].from,
//                         to: result[i].to,
//                         status: "out",
//                         remain_count: result[i].remain_count,
//                         out_dayPass: result[i].out_dayPass
//                     };

//                 }
//                 else if(result[i].pass_type == "day")
//                 {
//                     result[i].out_dayPass.push(timestamp);
//                     result[i].remain_count -= result[i].out_dayPass.length ;
//                     result[i].out_dayPass = [];                  
//                     // var flag = false;
//                     // for(var j = 0; j <  result[i].out_dayPass.length; j++)
//                     // {
//                     //     if(Math.floor(result[i].out_dayPass[j] / env_config.timeofday) ==  Math.floor(timestamp / env_config.timeofday))
//                     //         flag = true;
//                     // }
//                     // if(flag == false)
//                     // {
//                     //     result[i].out_dayPass.push(timestamp);
//                     //     result[i].remain_count -= result[i].out_dayPass.length ;
//                     //     result[i].out_dayPass = [];                        
//                     // }

//                     var updateData = {
//                         user_id: result[i].user_id,
//                         pass_type: result[i].pass_type,
//                         from: result[i].from,
//                         to: result[i].to,
//                         status: "out",
//                         remain_count: result[i].remain_count,
//                         out_dayPass: result[i].out_dayPass
//                     };

//                 }
//             }
//             else
//             {
//                 if(result[i].pass_type == "multi")
//                 {
//                     result[i].remain_count -= result[i].out_dayPass.length ;
//                     result[i].out_dayPass = [];                        

//                     var updateData = {
//                         user_id: result[i].user_id,
//                         pass_type: result[i].pass_type,
//                         from: result[i].from,
//                         to: result[i].to,
//                         status: "out",
//                         remain_count: result[i].remain_count,
//                         out_dayPass: result[i].out_dayPass
//                     };

//                 }
//                 else if(result[i].pass_type == "day")
//                 {
//                     result[i].remain_count -= result[i].out_dayPass.length ;
//                     result[i].out_dayPass = [];                  

//                     var updateData = {
//                         user_id: result[i].user_id,
//                         pass_type: result[i].pass_type,
//                         from: result[i].from,
//                         to: result[i].to,
//                         status: "out",
//                         remain_count: result[i].remain_count,
//                         out_dayPass: result[i].out_dayPass
//                     };

//                 }
//             }

//             if(updateData != {})
//             {
//                 var customer_id = result[i].user_id;
//                 var pass_type = result[i].pass_type;

//                 model_pass.findOneAndUpdate({user_id: customer_id, pass_type: pass_type}, {$set: updateData}, {new: true},  function(err, user){
//                     if (err) {
//                         console.log("message2:", err.message);
//                     }
//                     model_history.aggregate(
//                         {
//                             $match: {
//                                 user_id: customer_id
//                             }
//                         },

//                         function (err, result) {
//                             if(result.length == 0)
//                             {
//                                 var detail = [];

//                                 var temp = {
//                                     status: "out",
//                                     timestamp: timestamp,
//                                     pass_type: pass_type,
//                                     decimalcode: "",
//                                     action: "System"
//                                 }

//                                 detail.push(temp);

//                                 var history = new model_history(
//                                     {
//                                         user_id: customer_id,
//                                         timestamp: timestamp,
//                                         detail: detail
//                                     }
//                                 );

//                                 history.save(function(err, result) {
//                                     if (err) {
//                                         console.log("message3:", err.message);
//                                     }
//                                     console.log("history saved successfully.");
//                                 })
//                             }
//                             else
//                             {
//                                 var flag =  false;
//                                 for(var i = 0; i < result.length; i++)
//                                 {
//                                     if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
//                                     {
//                                         flag = true;
//                                     }
//                                 }

//                                 if(flag == false)
//                                 {
//                                     var detail = [];

//                                     var temp = {
//                                         status: "out",
//                                         timestamp: timestamp,
//                                         pass_type: pass_type,
//                                         decimalcode: "",
//                                         action: "System"
//                                     }

//                                     detail.push(temp);

//                                     var history = new model_history(
//                                         {
//                                             user_id: customer_id,
//                                             timestamp: timestamp,
//                                             detail: detail
//                                         }
//                                     );

//                                     history.save(function(err, result) {
//                                         if (err) {
//                                             console.log("message4:", err.message);
//                                         }
//                                         console.log("history saved successfully.");
//                                     });

//                                 }    
//                                 else
//                                 {
//                                     for(var i = 0; i < result.length; i++)
//                                     {
//                                         if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
//                                         {

//                                             var temp = {
//                                                 status: "out",
//                                                 timestamp: timestamp,
//                                                 pass_type: pass_type,
//                                                 decimalcode: "",
//                                                 action: "System"
//                                             }

//                                             result[i].detail.push(temp);

//                                             model_history.findOneAndUpdate({user_id: customer_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
//                                                 if (err) {
//                                                     console.log("message5:", err.message);
//                                                 }
//                                                 console.log("history saved successfully.");       
//                                             });                    
//                                         }
//                                     }
//                                 }   
//                             }
//                         }
//                     );      
//                 });
//             }
//         }

//     }); 

// }


exports.temp_checkout = function () {
    if (force_checkout_count < checkout_passes.length) {
        admin.real_checkout(checkout_passes[force_checkout_count], function () {
            admin.temp_checkout();
        });
    }
}


exports.real_checkout = function (pass, callback) {
    var timestamp = new Date().getTime();
    var updateData = {};
    if (pass.status == "in") {
        if (pass.pass_type == "season") {
            updateData = {
                user_id: pass.user_id,
                pass_type: pass.pass_type,
                from: pass.from,
                to: pass.to,
                status: "out",
                remain_count: 1
            };
        }

        else if (pass.pass_type == "promo") {
            updateData = {
                user_id: pass.user_id,
                pass_type: pass.pass_type,
                from: pass.from,
                to: pass.to,
                status: "out",
                remain_count: 0
            };
        }
        else if (pass.pass_type == "multi") {
            pass.out_dayPass = [];

            if (pass.remain_count > 0)
                pass.remain_count--;


            updateData = {
                user_id: pass.user_id,
                pass_type: pass.pass_type,
                from: pass.from,
                to: pass.to,
                status: "out",
                remain_count: pass.remain_count,
                out_dayPass: pass.out_dayPass
            };

        }
        else if (pass.pass_type == "day") {
            pass.out_dayPass = [];

            if (pass.remain_count > 0)
                pass.remain_count--;

            updateData = {
                user_id: pass.user_id,
                pass_type: pass.pass_type,
                from: pass.from,
                to: pass.to,
                status: "out",
                remain_count: pass.remain_count,
                out_dayPass: pass.out_dayPass
            };

        }
    }
    // else
    // {
    //     if(pass.pass_type == "multi")
    //     {
    //         pass.remain_count -= pass.out_dayPass.length ;
    //         pass.out_dayPass = [];                        

    //         updateData = {
    //             user_id: pass.user_id,
    //             pass_type: pass.pass_type,
    //             from: pass.from,
    //             to: pass.to,
    //             status: "out",
    //             remain_count: pass.remain_count,
    //             out_dayPass: pass.out_dayPass
    //         };

    //     }
    //     else if(pass.pass_type == "day")
    //     {
    //         pass.remain_count -= pass.out_dayPass.length ;
    //         pass.out_dayPass = [];                  

    //         updateData = {
    //             user_id: pass.user_id,
    //             pass_type: pass.pass_type,
    //             from: pass.from,
    //             to: pass.to,
    //             status: "out",
    //             remain_count: pass.remain_count,
    //             out_dayPass: pass.out_dayPass
    //         };

    //     }
    // }

    if (updateData != {}) {
        var customer_id = pass.user_id;
        var pass_type = pass.pass_type;

        model_pass.findOneAndUpdate({ user_id: customer_id, pass_type: pass_type }, { $set: updateData }, { new: true }, function (err, user) {
            if (err) {
                console.log("message2:", err.message);
            }
            model_history.aggregate(
                {
                    $match: {
                        user_id: customer_id
                    }
                },

                function (err, result) {
                    if (result.length == 0) {
                        var detail = [];

                        var temp = {
                            status: "out",
                            timestamp: timestamp,
                            pass_type: pass_type,
                            decimalcode: "",
                            action: "System"
                        }

                        detail.push(temp);

                        var history = new model_history(
                            {
                                user_id: customer_id,
                                timestamp: timestamp,
                                detail: detail
                            }
                        );

                        history.save(function (err, result) {
                            if (err) {
                                console.log("message3:", err.message);
                            }
                            force_checkout_count++;
                            callback();
                            console.log("history saved successfully.");
                        })
                    }
                    else {
                        var flag = false;
                        for (var i = 0; i < result.length; i++) {
                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {
                                flag = true;
                            }
                        }

                        if (flag == false) {
                            var detail = [];

                            var temp = {
                                status: "out",
                                timestamp: timestamp,
                                pass_type: pass_type,
                                decimalcode: "",
                                action: "System"
                            }

                            detail.push(temp);

                            var history = new model_history(
                                {
                                    user_id: customer_id,
                                    timestamp: timestamp,
                                    detail: detail
                                }
                            );

                            history.save(function (err, result) {
                                if (err) {
                                    console.log("message4:", err.message);
                                }
                                force_checkout_count++;
                                callback();
                                console.log("history saved successfully.");
                            });

                        }
                        else {
                            for (var i = 0; i < result.length; i++) {
                                if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday)) {

                                    var temp = {
                                        status: "out",
                                        timestamp: timestamp,
                                        pass_type: pass_type,
                                        decimalcode: "",
                                        action: "System"
                                    }

                                    result[i].detail.push(temp);

                                    var update_data = {
                                        detail: result[i].detail
                                    }

                                    model_history.findOneAndUpdate({ user_id: customer_id, timestamp: result[i].timestamp }, { $set: update_data }, { new: true }, function (err, user) {
                                        if (err) {
                                            console.log("message5:", err.message);
                                        }
                                        force_checkout_count++;
                                        callback();
                                        console.log("history saved successfully.");
                                    });
                                }
                            }
                        }
                    }
                }
            );
        });
    }
}

exports.force_checkout = function (req, res) {
    model_pass.find({ status: "in" }, function (err, result) {
        if (err) {
            console.log("message1:", err.message);
        }

        var timestamp = new Date().getTime();

        checkout_passes = result;

        force_checkout_count = 0;

        if (checkout_passes.length > 0) {
            admin.temp_checkout();
        }


    });

}

exports.admin_pass_update = function (req, res) {
    model_admin.findOne({ user_token: req.body.user_token }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1
            });
        }

        // if(new Date().getTime() - result.signin_time > 10800000)
        // {
        //     return res.status(200).json({
        //         result: -1     
        //     });
        // }

        var admin_name = result.user_name
        pass_updated_count = 0;
        admin.customer_pass_update(req.body.customer_id, req.body.pass, admin_name, req.body.stripe_customer_id, req.body.stripe_subscription_id);
        return res.status(200).json({
            result: 1,
        });

    });
}



exports.customer_pass_update = function (customer_id, customer_pass, admin_name, stripe_customer_id, stripe_subscription_id) {
    if (pass_updated_count < customer_pass.length) {
        admin.real_pass_update(customer_id, customer_pass[pass_updated_count], admin_name, customer_pass, stripe_customer_id, stripe_subscription_id, function (id, passes, name, customer_id, subscription_id) {
            admin.customer_pass_update(id, passes, name, customer_id, subscription_id);
        });
    }

}



exports.real_pass_update = function (customer_id, ele_pass, admin_name, customer_pass, stripe_customer_id, stripe_subscription_id, callback) {
    model_pass.find({ user_id: customer_id }, function (err, result) {
        if (err) {
            console.log(err);
        }

        if (ele_pass.status != undefined && ele_pass.status.indexOf("add") == 0) {
            model_pass.find({ user_id: customer_id }, function (err, result) {
                if (err) {
                    console.log(err);
                }
                if (!result) {
                    console.log(err);
                }
                var flag = false;
                for (var i = 0; i < result.length; i++) {
                    if (result[i].pass_type == ele_pass.type) {
                        flag = true;
                    }
                }
                if (flag == true) {
                    for (var i = 0; i < result.length; i++) {
                        if (result[i].pass_type == ele_pass.type) {
                            var updateData = {
                                from: (result[i].from < ele_pass.from) ? result[i].from : ele_pass.from,
                                to: (result[i].to > ele_pass.to) ? result[i].to : ele_pass.to,
                                remain_count: result[i].remain_count + ele_pass.quantity
                            }
                            model_pass.findOneAndUpdate({ user_id: customer_id, pass_type: ele_pass.type }, { $set: updateData }, { new: true }, function (err, user) {
                                if (err) {
                                    console.log(err);
                                }
                                var admin_history = new model_admin_history({
                                    type: ele_pass.changing,
                                    action: admin_name,
                                    date_time: new Date().getTime(),
                                    notes: '',
                                    customer_id: customer_id
                                });
                                admin_history.save(function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    pass_updated_count++;
                                    callback(customer_id, customer_pass, admin_name, stripe_customer_id, stripe_subscription_id);
                                });
                            });
                        }
                    }
                }
                else {
                    if (ele_pass.type != "season") {
                        var pass = new model_pass({
                            user_id: customer_id,
                            pass_type: ele_pass.type,
                            from: ele_pass.from,
                            to: ele_pass.to,
                            remain_count: ele_pass.quantity
                        });

                        pass.save(function (err, result) {
                            if (err) {
                                console.log(err);
                            }
                            var admin_history = new model_admin_history({
                                type: ele_pass.changing,
                                date_time: new Date().getTime(),
                                action: admin_name,
                                notes: '',
                                customer_id: customer_id
                            });
                            admin_history.save(function (err, result) {
                                if (err) {
                                    console.log(err);
                                }
                                pass_updated_count++;
                                callback(customer_id, customer_pass, admin_name, stripe_customer_id, stripe_subscription_id);

                            });
                        });
                    }
                    else {
                        var update_user = {
                            stripe_subscriptionid: stripe_subscription_id,
                            stripe_customerid: stripe_customer_id
                        }

                        model_user.findOneAndUpdate({ _id: customer_id }, { $set: update_user }, { new: true }, function (err, user) {
                            if (err) {
                                console.log("user update error 1", err)
                            }
                            else {
                                var pass = new model_pass({
                                    user_id: customer_id,
                                    pass_type: ele_pass.type,
                                    from: ele_pass.from,
                                    to: ele_pass.to,
                                    remain_count: ele_pass.quantity
                                });

                                pass.save(function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    var admin_history = new model_admin_history({
                                        type: ele_pass.changing,
                                        date_time: new Date().getTime(),
                                        action: admin_name,
                                        notes: '',
                                        customer_id: customer_id
                                    });
                                    admin_history.save(function (err, result) {
                                        if (err) {
                                            console.log(err);
                                        }
                                        pass_updated_count++;
                                        callback(customer_id, customer_pass, admin_name, stripe_customer_id, stripe_subscription_id);

                                    });
                                });
                            }
                        });

                    }
                }
            });
        }

        if (ele_pass.status == "edit") {
            model_pass.find({ user_id: customer_id }, function (err, result) {
                if (err) {
                    console.log(err);
                }
                if (!result) {
                    console.log(err);
                }
                var flag = false;
                for (var i = 0; i < result.length; i++) {
                    if (result[i].pass_type == ele_pass.type) {
                        flag = true;
                    }
                }
                if (flag == true) {
                    for (var i = 0; i < result.length; i++) {
                        if (result[i].pass_type == ele_pass.type) {
                            if (ele_pass.season_status != undefined) {
                                var updateData = {
                                    from: (result[i].from < ele_pass.from) ? result[i].from : ele_pass.from,
                                    to: ele_pass.to,
                                    remain_count: ele_pass.quantity,
                                    terminate: ele_pass.terminate,
                                    freeze_to: ele_pass.freeze_to,
                                    freeze_from: ele_pass.freeze_from,
                                    season_status: ele_pass.season_status
                                }
                            }
                            else {
                                var updateData = {
                                    from: (result[i].from < ele_pass.from) ? result[i].from : ele_pass.from,
                                    to: ele_pass.to,
                                    remain_count: ele_pass.quantity,
                                    terminate: ele_pass.terminate,
                                    freeze_to: ele_pass.freeze_to,
                                    freeze_from: ele_pass.freeze_from,
                                }
                            }

                            model_pass.findOneAndUpdate({ user_id: customer_id, pass_type: ele_pass.type }, { $set: updateData }, { new: true }, function (err, user) {
                                if (err) {
                                    console.log(err);
                                }


                                var admin_history = new model_admin_history({
                                    type: ele_pass.changing,
                                    action: admin_name,
                                    date_time: new Date().getTime(),
                                    notes: '',
                                    customer_id: customer_id
                                });
                                admin_history.save(function (err, result) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    pass_updated_count++;
                                    callback(customer_id, customer_pass, admin_name, stripe_customer_id, stripe_subscription_id);
                                });
                            });
                        }
                    }
                }

            });
        }

        if (ele_pass.status == undefined || ele_pass.status == "") {
            pass_updated_count++;
            callback(customer_id, customer_pass, admin_name, stripe_customer_id, stripe_subscription_id);
        }

    });
}

exports.admin_manual_entry = function (req, res) {
    var phone_number;
    if (req.body.phone_number.indexOf('+') >= 0)
        phone_number = req.body.phone_number;
    else
        phone_number = '+' + req.body.phone_number

    model_user.findOne({ user_phoneNumber: phone_number }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1
            });
        }
        admin.callback_count = 0;
        admin.customer_id = result.id;
        admin.purchase_itmes = req.body.items;
        admin.admin_name = req.body.staff_name;

        admin.tempbuy(admin.customer_id, admin.purchase_itmes, admin.admin_name);
        return res.status(200).json({
            result: 1
        });
    });
}

exports.tempbuy = function (customer_id, items, admin_name) {
    if (admin.callback_count < items.length) {
        admin.buyGear(customer_id, items[admin.callback_count], admin_name, function () {
            admin.tempbuy(admin.customer_id, admin.purchase_itmes, admin.admin_name);
        });
    }
    else {
        admin.socket_getPendingRental();
    }

}

exports.buyGear = function (user_id, checkout, staff_name, callback) {
    switch (checkout.type) {
        case "shoe":
            model_equipment.findOne({ type: checkout.type }, function (err, equipment) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }

                var updateData = {
                    quantity: equipment.quantity - checkout.quantity
                }
                model_equipment.findOneAndUpdate({ type: checkout.type }, { $set: updateData }, { new: true }, function (err, equipment) {
                    if (err) {
                        return res.status(200).json({
                            result: 0
                        });
                    }
                    model_purchase.aggregate(
                        {
                            $match: {
                                user_id: user_id
                            }
                        },

                        function (err, result) {
                            var current_time_stamp = new Date().getTime();
                            if (result.length == 0) {
                                var detail = [];

                                var temp = {
                                    type: checkout.type,
                                    size: checkout.size,
                                    quantity: checkout.quantity,
                                    message: ((checkout.size + ' Shoe Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                    status: checkout.status,
                                    timestamp: current_time_stamp,
                                    id: "purchase_" + service.token_generator(),
                                    action: staff_name
                                }

                                detail.push(temp);

                                var purchase = new model_purchase(
                                    {
                                        user_id: user_id,
                                        timestamp: current_time_stamp,
                                        detail: detail
                                    }
                                );

                                purchase.save(function (err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    admin.callback_count++;
                                    callback();
                                });

                            }
                            else {
                                var flag = false;

                                for (var i = 0; i < result.length; i++) {
                                    if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                        flag = true;
                                    }
                                }

                                if (flag == false) {
                                    var detail = [];

                                    var temp = {
                                        type: checkout.type,
                                        size: checkout.size,
                                        quantity: checkout.quantity,
                                        message: ((checkout.size + ' Shoe Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                        status: checkout.status,
                                        timestamp: current_time_stamp,
                                        id: "purchase_" + service.token_generator(),
                                        action: staff_name
                                    }

                                    detail.push(temp);

                                    var purchase = new model_purchase(
                                        {
                                            user_id: user_id,
                                            timestamp: current_time_stamp,
                                            detail: detail
                                        }
                                    );

                                    purchase.save(function (err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        admin.callback_count++;
                                        callback();
                                    });
                                }
                                else {
                                    var shoe_flag = false;
                                    for (var i = 0; i < result.length; i++) {
                                        if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                            for (var j = 0; j < result[i].detail.length; j++) {
                                                if (result[i].detail[j].message.indexOf(checkout.size + ' Shoe Rental') >= 0 && result[i].detail[j].status == checkout.status) {
                                                    shoe_flag = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (shoe_flag == false) {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                                var temp = {
                                                    type: checkout.type,
                                                    size: checkout.size,
                                                    quantity: checkout.quantity,
                                                    message: ((checkout.size + ' Shoe Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                                    status: checkout.status,
                                                    timestamp: current_time_stamp,
                                                    id: "purchase_" + service.token_generator(),
                                                    action: staff_name
                                                }

                                                result[i].detail.push(temp);

                                                model_purchase.findOneAndUpdate({ user_id: user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    admin.callback_count++;
                                                    callback();
                                                });
                                                break;

                                            }
                                        }
                                    }
                                    else {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                                for (var j = 0; j < result[i].detail.length; j++) {
                                                    if (result[i].detail[j].message.indexOf(checkout.size + ' Shoe Rental') >= 0 && result[i].detail[j].status == checkout.status) {
                                                        result[i].detail[j].quantity += checkout.quantity;
                                                        result[i].detail[j].message = (checkout.size + ' Shoe Rental' + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                    }
                                                }

                                                model_purchase.findOneAndUpdate({ user_id: user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    admin.callback_count++;
                                                    callback();
                                                });
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    );
                });
            });
            break;
        case "sock":
            model_equipment.findOne({ type: checkout.type }, function (err, equipment) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }

                var updateData = {
                    quantity: equipment.quantity - checkout.quantity
                }
                model_equipment.findOneAndUpdate({ type: checkout.type }, { $set: updateData }, { new: true }, function (err, equipment) {
                    if (err) {
                        return res.status(200).json({
                            result: 0
                        });
                    }
                    model_purchase.aggregate(
                        {
                            $match: {
                                user_id: user_id
                            }
                        },

                        function (err, result) {
                            var current_time_stamp = new Date().getTime();
                            if (result.length == 0) {
                                var detail = [];

                                var temp = {
                                    type: checkout.type,
                                    size: checkout.size,
                                    quantity: checkout.quantity,
                                    message: (('Socks') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                    status: checkout.status,
                                    timestamp: current_time_stamp,
                                    id: "purchase_" + service.token_generator(),
                                    action: staff_name
                                }

                                detail.push(temp);

                                var purchase = new model_purchase(
                                    {
                                        user_id: user_id,
                                        timestamp: current_time_stamp,
                                        detail: detail
                                    }
                                );

                                purchase.save(function (err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    admin.callback_count++;
                                    callback();
                                });

                            }
                            else {
                                var flag = false;

                                for (var i = 0; i < result.length; i++) {
                                    if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                        flag = true;
                                    }
                                }

                                if (flag == false) {
                                    var detail = [];

                                    var temp = {
                                        type: checkout.type,
                                        size: checkout.size,
                                        quantity: checkout.quantity,
                                        message: (('Socks') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                        status: checkout.status,
                                        timestamp: current_time_stamp,
                                        id: "purchase_" + service.token_generator(),
                                        action: staff_name
                                    }

                                    detail.push(temp);

                                    var purchase = new model_purchase(
                                        {
                                            user_id: user_id,
                                            timestamp: current_time_stamp,
                                            detail: detail
                                        }
                                    );

                                    purchase.save(function (err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        admin.callback_count++;
                                        callback();
                                    });
                                }
                                else {
                                    var sock_flag = false;
                                    for (var i = 0; i < result.length; i++) {
                                        if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                            for (var j = 0; j < result[i].detail.length; j++) {
                                                if (result[i].detail[j].type == checkout.type && result[i].detail[j].status == checkout.status) {
                                                    sock_flag = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (sock_flag == false) {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                                var temp = {
                                                    type: checkout.type,
                                                    size: checkout.size,
                                                    quantity: checkout.quantity,
                                                    message: (('Socks') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                                    status: checkout.status,
                                                    timestamp: current_time_stamp,
                                                    id: "purchase_" + service.token_generator(),
                                                    action: staff_name
                                                }

                                                result[i].detail.push(temp);

                                                model_purchase.findOneAndUpdate({ user_id: user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    admin.callback_count++;
                                                    callback();
                                                });

                                                break;

                                            }
                                        }
                                    }
                                    else {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                                for (var j = 0; j < result[i].detail.length; j++) {
                                                    if (result[i].detail[j].type == checkout.type && result[i].detail[j].status == checkout.status) {
                                                        result[i].detail[j].quantity += checkout.quantity;
                                                        result[i].detail[j].message = ('Socks' + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                    }
                                                }

                                                model_purchase.findOneAndUpdate({ user_id: user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                });
                                                admin.callback_count++;
                                                callback();
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    );
                });
            });
            break;
        case "chalkbag":
            model_equipment.findOne({ type: checkout.type }, function (err, equipment) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }

                var updateData = {
                    quantity: equipment.quantity - checkout.quantity
                }
                model_equipment.findOneAndUpdate({ type: checkout.type }, { $set: updateData }, { new: true }, function (err, equipment) {
                    if (err) {
                        return res.status(200).json({
                            result: 0
                        });
                    }
                    model_purchase.aggregate(
                        {
                            $match: {
                                user_id: user_id
                            }
                        },

                        function (err, result) {
                            var current_time_stamp = new Date().getTime();
                            if (result.length == 0) {
                                var detail = [];

                                var temp = {
                                    type: checkout.type,
                                    size: checkout.size,
                                    quantity: checkout.quantity,
                                    message: (('Chalkbag Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                    status: checkout.status,
                                    timestamp: current_time_stamp,
                                    id: "purchase_" + service.token_generator(),
                                    action: staff_name
                                }

                                detail.push(temp);

                                var purchase = new model_purchase(
                                    {
                                        user_id: user_id,
                                        timestamp: current_time_stamp,
                                        detail: detail
                                    }
                                );

                                purchase.save(function (err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    admin.callback_count++;
                                    callback();
                                });

                            }
                            else {
                                var flag = false;

                                for (var i = 0; i < result.length; i++) {
                                    if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                        flag = true;
                                    }
                                }

                                if (flag == false) {
                                    var detail = [];

                                    var temp = {
                                        type: checkout.type,
                                        size: checkout.size,
                                        quantity: checkout.quantity,
                                        message: (('Chalkbag Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                        status: checkout.status,
                                        timestamp: current_time_stamp,
                                        id: "purchase_" + service.token_generator(),
                                        action: staff_name
                                    }

                                    detail.push(temp);

                                    var purchase = new model_purchase(
                                        {
                                            user_id: user_id,
                                            timestamp: current_time_stamp,
                                            detail: detail
                                        }
                                    );

                                    purchase.save(function (err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        admin.callback_count++;
                                        callback();
                                    });
                                }
                                else {
                                    var chalkbag_flag = false;
                                    for (var i = 0; i < result.length; i++) {
                                        if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                            for (var j = 0; j < result[i].detail.length; j++) {
                                                if (result[i].detail[j].type == checkout.type && result[i].detail[j].status == checkout.status) {
                                                    chalkbag_flag = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if (chalkbag_flag == false) {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                                var temp = {
                                                    type: checkout.type,
                                                    size: checkout.size,
                                                    quantity: checkout.quantity,
                                                    message: (('Chalkbag Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                                    status: checkout.status,
                                                    timestamp: current_time_stamp,
                                                    id: "purchase_" + service.token_generator(),
                                                    action: staff_name
                                                }

                                                result[i].detail.push(temp);

                                                model_purchase.findOneAndUpdate({ user_id: user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    admin.callback_count++;
                                                    callback();
                                                });

                                                break;

                                            }
                                        }
                                    }
                                    else {
                                        for (var i = 0; i < result.length; i++) {
                                            if (Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(current_time_stamp / env_config.timeofday)) {
                                                for (var j = 0; j < result[i].detail.length; j++) {
                                                    if (result[i].detail[j].type == checkout.type && result[i].detail[j].status == checkout.status) {
                                                        result[i].detail[j].quantity += checkout.quantity;
                                                        result[i].detail[j].message = ('Chalkbag Rental' + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                    }
                                                }

                                                model_purchase.findOneAndUpdate({ user_id: user_id, timestamp: result[i].timestamp }, { $set: result[i] }, { new: true }, function (err, user) {
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    admin.callback_count++;
                                                    callback();
                                                });
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    );
                });
            });
            break;
    }
}

exports.getPendingRental = function (req, res) {
    model_user.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }

        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        var users = result;

        model_purchase.find({}, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }

            if (!result) {
                return res.status(200).json({
                    result: 0
                });
            }

            var return_res = [];
            for (var i = 0; i < result.length; i++) {

                var temp = {
                    user_id: result[i].user_id,
                    user_name: "",
                    user_avatar: "",
                    items: []
                }

                for (var j = 0; j < users.length; j++) {
                    if (result[i].user_id == users[j].id) {
                        temp.user_name = users[j].firstName + " " + users[j].familyName;
                        temp.user_avatar = env_config.server_url + users[j].picture_avatar
                    }
                }

                for (var j = 0; j < result[i].detail.length; j++) {
                    if (result[i].detail[j].status == "fullfilled") {
                        var message_web = "";
                        switch (result[i].detail[j].type) {
                            case "shoe":
                                message_web = "Shoe Rental" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                            case "sock":
                                message_web = "Socks" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                            case "chalkbag":
                                message_web = "Chalkbag Rental" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                        }
                        var temp_item = {
                            type: result[i].detail[j].type,
                            size: result[i].detail[j].size,
                            quantity: result[i].detail[j].quantity,
                            message: result[i].detail[j].message,
                            message_web: message_web,
                            status: result[i].detail[j].status,
                            timestamp: result[i].detail[j].timestamp,
                            id: result[i].detail[j].id,
                        }
                        temp.items.push(temp_item);
                    }
                }

                if (temp.items.length != 0) {
                    var flag = false;
                    for (var j = 0; j < return_res.length; j++) {
                        if (return_res[j].user_id == temp.user_id) {
                            flag = true;
                            for (var k = 0; k < temp.items.length; k++)
                                return_res[j].items.push(temp.items[k]);
                        }
                    }
                    if (flag == false)
                        return_res.push(temp);
                }

            }

            return res.status(200).json({
                result: 1,
                info: return_res
            });

        });
    });

}

exports.socket_getPendingRental = function () {
    model_user.find({}, function (err, result) {
        if (err) {
            console("user err", err);
        }

        if (!result) {
            console.log("user length: 0");
        }

        var users = result;

        model_purchase.find({}, function (err, result) {
            if (err) {
                console("purchase err", err);
            }

            if (!result) {
                console.log("purchase length: 0");
            }

            var return_res = [];
            for (var i = 0; i < result.length; i++) {

                var temp = {
                    user_id: result[i].user_id,
                    user_name: "",
                    user_avatar: "",
                    items: []
                }

                for (var j = 0; j < users.length; j++) {
                    if (result[i].user_id == users[j].id) {
                        temp.user_name = users[j].firstName + " " + users[j].familyName;
                        temp.user_avatar = env_config.server_url + users[j].picture_avatar
                    }
                }

                for (var j = 0; j < result[i].detail.length; j++) {
                    if (result[i].detail[j].status == "fullfilled") {
                        var message_web = "";
                        switch (result[i].detail[j].type) {
                            case "shoe":
                                message_web = "Shoe Rental" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                            case "sock":
                                message_web = "Socks" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                            case "chalkbag":
                                message_web = "Chalkbag Rental" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                        }
                        var temp_item = {
                            type: result[i].detail[j].type,
                            size: result[i].detail[j].size,
                            quantity: result[i].detail[j].quantity,
                            message: result[i].detail[j].message,
                            message_web: message_web,
                            status: result[i].detail[j].status,
                            timestamp: result[i].detail[j].timestamp,
                            id: result[i].detail[j].id,
                        }
                        temp.items.push(temp_item);
                    }
                }

                if (temp.items.length != 0) {
                    var flag = false;
                    for (var j = 0; j < return_res.length; j++) {
                        if (return_res[j].user_id == temp.user_id) {
                            flag = true;
                            for (var k = 0; k < temp.items.length; k++)
                                return_res[j].items.push(temp.items[k]);
                        }
                    }
                    if (flag == false)
                        return_res.push(temp);
                }

            }
            admin.pending_length = return_res.length;
            if (admin.socket != null) {
                admin.socket.emit("pending_length", admin.pending_length);
                admin.socket.broadcast.emit("pending_length", admin.pending_length);
            }

        });
    });

}

exports.getRented = function (req, res) {
    model_user.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }

        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        var users = result;

        model_purchase.find({}, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }

            if (!result) {
                return res.status(200).json({
                    result: 0
                });
            }

            var shoe_rented_count = [];
            var sock_rented_count = 0;
            var chalkbag_rented_count = 0;
            for (var i = 2.0; i <= 14.0; i += 0.5) {
                var temp =
                    {
                        size: i.toFixed(1),
                        count: 0
                    }

                shoe_rented_count.push(temp);
            }

            var return_res = [];
            for (var i = 0; i < result.length; i++) {

                var temp = {
                    user_id: result[i].user_id,
                    user_name: "",
                    edit: false,
                    items: []
                }

                for (var j = 0; j < users.length; j++) {
                    if (result[i].user_id == users[j].id) {
                        temp.user_name = users[j].firstName + " " + users[j].familyName;
                    }
                }

                for (var j = 0; j < result[i].detail.length; j++) {
                    if (result[i].detail[j].status == "rented") {
                        for (var k = 0; k < shoe_rented_count.length; k++) {
                            if (shoe_rented_count[k].size == result[i].detail[j].size) {
                                shoe_rented_count[k].count += result[i].detail[j].quantity;
                            }
                        }

                        if (result[i].detail[j].type == "sock") {
                            sock_rented_count += result[i].detail[j].quantity;
                        }

                        if (result[i].detail[j].type == "chalkbag") {
                            chalkbag_rented_count += result[i].detail[j].quantity;
                        }

                        var message_web = "";
                        switch (result[i].detail[j].type) {
                            case "shoe":
                                message_web = "Shoe Rental" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                            case "sock":
                                message_web = "Socks" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                            case "chalkbag":
                                message_web = "Chalkbag Rental" + ((result[i].detail[j].quantity > 1) ? (' * ' + result[i].detail[j].quantity) : "");
                                break;
                        }
                        var temp_item = {
                            type: result[i].detail[j].type,
                            size: result[i].detail[j].size,
                            quantity: result[i].detail[j].quantity,
                            message: result[i].detail[j].message,
                            message_web: message_web,
                            status: result[i].detail[j].status,
                            timestamp: result[i].detail[j].timestamp,
                            id: result[i].detail[j].id,
                        }
                        temp.items.push(temp_item);
                    }
                }

                if (temp.items.length != 0) {
                    var flag = false;
                    for (var j = 0; j < return_res.length; j++) {
                        if (return_res[j].user_id == temp.user_id) {
                            flag = true;
                            for (var k = 0; k < temp.items.length; k++)
                                return_res[j].items.push(temp.items[k]);
                        }
                    }
                    if (flag == false)
                        return_res.push(temp);
                }

            }

            return res.status(200).json({
                result: 1,
                info: return_res,
                shoe_rented_count: shoe_rented_count,
                sock_rented_count: sock_rented_count,
                chalkbag_rented_count: chalkbag_rented_count
            });

        });
    });
}

exports.rented_returned = function (req, res) {
    model_purchase.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }

        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < result[i].detail.length; j++) {
                for (var k = 0; k < req.body.element.items.length; k++) {
                    if (result[i].detail[j].id == req.body.element.items[k].id) {
                        result[i].detail[j].status = "returned";
                    }
                }
            }
        }

        for (var i = 0; i < result.length; i++) {
            var updateData = {
                user_id: result[i].user_id,
                timestamp: result[i].timestamp,
                detail: result[i].detail
            }
            model_purchase.findOneAndUpdate({ user_id: result[i].user_id }, { $set: updateData }, { new: true }, function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }
            });
        }

        return res.status(200).json({
            result: 1,
        });

    });
}

exports.rented_edit = function (req, res) {
    model_purchase.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }

        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < result[i].detail.length; j++) {
                for (var k = 0; k < req.body.element.items.length; k++) {
                    if (result[i].detail[j].id == req.body.element.items[k].id && result[i].detail[j].type == "shoe") {
                        var message = result[i].detail[j].message.replace(result[i].detail[j].size, req.body.element.items[k].size);
                        result[i].detail[j].message = message;
                        result[i].detail[j].size = req.body.element.items[k].size;
                    }
                }
            }
        }

        for (var i = 0; i < result.length; i++) {
            var updateData = {
                user_id: result[i].user_id,
                timestamp: result[i].timestamp,
                detail: result[i].detail
            }
            model_purchase.findOneAndUpdate({ user_id: result[i].user_id }, { $set: updateData }, { new: true }, function (err, result) {
                if (err) {
                    return res.status(200).json({
                        result: 0
                    });
                }
            });
        }

        return res.status(200).json({
            result: 1,
        });

    });
}

exports.fullfill_item = function (req, res) {
    model_purchase.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }

        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }
        var updateData;
        for (var i = 0; i < result.length; i++) {

            for (var j = 0; j < result[i].detail.length; j++) {
                if (result[i].detail[j].id == req.body.item.id) {
                    var message = "";
                    switch (result[i].detail[j].type) {
                        case "shoe":
                            message = req.body.item.size + " Shoe Rental" + ((req.body.item.quantity > 1) ? (" * " + req.body.item.quantity) : "");
                            break;
                        case "sock":
                            message = "Socks" + ((req.body.item.quantity > 1) ? (" * " + req.body.item.quantity) : "");
                            break;
                        case "chalkbag":
                            message = "Chalkbag Rental" + ((req.body.item.quantity > 1) ? (" * " + req.body.item.quantity) : "");
                            break;
                    }
                    result[i].detail[j].size = req.body.item.size;
                    result[i].detail[j].status = "rented";
                    result[i].detail[j].message = message;
                    updateData = result[i];
                }
            }
        }

        model_purchase.findOneAndUpdate({ user_id: updateData.user_id, timestamp: updateData.timestamp }, { $set: updateData }, { new: true }, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            return res.status(200).json({
                result: 1
            });
        });
    });
}


exports.remove_item = function (req, res) {
    model_purchase.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }

        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }
        var updateData;
        for (var i = 0; i < result.length; i++) {

            for (var j = 0; j < result[i].detail.length; j++) {
                if (result[i].detail[j].id == req.body.item.id) {
                    result[i].detail.splice(j, 1);
                    updateData = result[i];
                }
            }
        }

        model_purchase.findOneAndUpdate({ user_id: updateData.user_id, timestamp: updateData.timestamp }, { $set: updateData }, { new: true }, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            return res.status(200).json({
                result: 1
            });
        });
    });
}

exports.getStatistics1 = function (req, res) {
    model_history.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }
        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        var today = new Date().toDateString();
        var before_oneyear = new Date().setFullYear(new Date().getFullYear() - 1);
        var before_onemonth = new Date().setMonth(new Date().getMonth() - 1);
        var before_oneweek = new Date().setDate(new Date().getDate() - 7);
        var before_oneday = new Date().setDate(new Date().getDate() - 1);

        var return_res =
            {
                pass: [
                    {
                        type: "season",
                        count: 0
                    },
                    {
                        type: "promo",
                        count: 0
                    },
                    {
                        type: "day",
                        count: 0
                    },
                    {
                        type: "multi",
                        count: 0
                    }
                ]
            }

        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < result[i].detail.length; j++) {
                if (result[i].detail[j].status == "in" && result[i].detail[j].timestamp >= new Date(req.body.time.split(' - ')[0]).getTime() && result[i].detail[j].timestamp <= new Date((req.body.time.split(' - ')[1] + " 23:59:59")).getTime()) {
                    for (var l = 0; l < return_res.pass.length; l++) {
                        if (return_res.pass[l].type == result[i].detail[j].pass_type)
                            return_res.pass[l].count++;
                    }
                }
            }
        }

        return res.status(200).json({
            result: 1,
            detail: return_res
        });
    });
}

exports.getStatistics2 = function (req, res) {

    model_user.find({}, function (err, result) {
        if (err) {
            return res.status(200).json({
                result: 0
            });
        }

        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        var users = result;

        model_history.find({}, function (err, result) {
            if (err) {
                return res.status(200).json({
                    result: 0
                });
            }
            if (!result) {
                return res.status(200).json({
                    result: 0
                });
            }

            var today = new Date().toDateString();
            var return_res =
                {
                    detail: []
                }


            for (var i = 0; i < result.length; i++) {
                for (var j = 0; j < result[i].detail.length; j++) {
                    if (result[i].detail[j].timestamp >= new Date(req.body.time.split(' - ')[0]).getTime() && result[i].detail[j].timestamp <= new Date((req.body.time.split(' - ')[1] + " 23:59:59")).getTime()) {
                        for (var m = 0; m < users.length; m++) {
                            if (result[i].user_id == users[m].id) {
                                var temp = {
                                    id: 0,
                                    user_name: users[m].firstName + " " + users[m].familyName,
                                    nric: users[m].nric_passNumber,
                                    phone_number: users[m].user_phoneNumber.slice(1, users[m].user_phoneNumber.length),
                                    pass_type: ((result[i].detail[j].pass_type == "promo") ? "COMPLEMENTARY" : result[i].detail[j].pass_type.toUpperCase()),
                                    status: result[i].detail[j].status,
                                    timestamp: result[i].detail[j].timestamp,
                                    duration: 0
                                }

                                return_res.detail.push(temp);
                            }
                        }
                    }
                }
            }


            for (var j = 0; j < return_res.detail.length - 1; j++) {
                for (var k = j + 1; k < return_res.detail.length; k++) {
                    if (return_res.detail[j].status == "in" && return_res.detail[k].status == "out" && return_res.detail[j].pass_type == return_res.detail[k].pass_type && return_res.detail[j].nric == return_res.detail[k].nric) {
                        return_res.detail[j].duration = return_res.detail[k].timestamp - return_res.detail[j].timestamp;
                        break;
                    }
                }
            }

            for (var j = 0; j < return_res.detail.length; j++) {
                if (return_res.detail[j].duration == 0) {
                    return_res.detail.splice(j, 1);
                }
            }

            for (var j = 0; j < return_res.detail.length; j++) {
                return_res.detail[j].id = j + 1;
                return_res.detail[j].timestamp = service.dateFormat(return_res.detail[j].timestamp);
                return_res.detail[j].duration = ((return_res.detail[j].duration / 3600000).toFixed(0) + "h");
            }


            return res.status(200).json({
                result: 1,
                detail: return_res
            });
        });
    });

}

exports.customer_delete = function (req, res) {

    model_user.findOne({ user_phoneNumber: "+" + req.body.customer_phone_number }, function (err, result) {
        if (!result) {
            return res.status(200).json({
                result: 0
            });
        }

        var customer_id = result.id;
        model_user.find({ _id: customer_id }).remove().exec();

        model_pass.find({ user_id: customer_id }, function (err, result) {
            if (result.length > 0)
                model_pass.find({ user_id: customer_id }).remove().exec();

        });

        model_history.find({ user_id: customer_id }, function (err, result) {
            if (result.length > 0)
                model_history.find({ user_id: customer_id }).remove().exec();
        });

        model_purchase.find({ user_id: customer_id }, function (err, result) {
            if (result.length > 0)
                model_purchase.find({ user_id: customer_id }).remove().exec();
        });

        return res.status(200).json({
            result: 1
        });
    });

}

exports.admin_schedule = function () {
    model_user.find({}, function (err, result) {
        if (err) {
            return;
        }
        if (!result) {
            return;
        }

        users = result;

        model_pass.find({ pass_type: "season" }, function (err, result) {
            if (err) {
                return;
            }
            if (!result) {
                return;
            }

            passes = result;

            current_day = dateFormat(new Date(), "yyyy/mm/dd");

            schedule_count = 0;

            admin.temp_schedule(current_day, users, passes);

        });
    });

}

exports.export_csv = function (req, res) {

    // var directory_path = path.join(__dirname + '../../../assets/customerInfo/');
    // var file_name = "customerInfo.csv";
    // // res.attachment(directory_path + file_name);
    // res.attachment(file_name);

    model_user.find().lean().exec({}, function (err, users) {

        if (err) res.send(err);

        var return_obj = [];


        for (var i = 0; i < users.length; i++) {
            var timestamp = new Date().getTime();

            model_pass.find({ user_id: users[i]._id }, function (err, result) {
                if (err) {
                    return res.status(500).send({ message: err.message });
                }

                var temp = {
                    user_phoneNumber: users[return_obj.length].user_phoneNumber,
                    firstName: users[return_obj.length].firstName,
                    familyName: users[return_obj.length].familyName,
                    birthDate: users[return_obj.length].birthDate,
                    gender: users[return_obj.length].gender,
                    guardian_name: users[return_obj.length].guardian_name,
                    guardian_phoneNumber: users[return_obj.length].guardian_phoneNumber,
                    guardian_relationship: users[return_obj.length].guardian_relationship,
                    emergency_name: users[return_obj.length].emergency_name,
                    emergency_phoneNumber: users[return_obj.length].emergency_phoneNumber,
                    emergency_relationship: users[return_obj.length].emergency_relationship,
                    picture_avatar: users[return_obj.length].picture_avatar,
                    picture_sign: users[return_obj.length].picture_sign,
                    pdf_url: users[return_obj.length].pdf_url,
                    signup_date: users[return_obj.length].signup_date,
                    season_pass: "disable",
                    day_pass_count: 0,
                    multi_pass_count: 0,
                    complementry_pass_count: 0
                }

                for (var i = 0; i < result.length; i++) {
                    switch (result[i].pass_type) {
                        case "promo":

                            if (result[i].remain_count != 0 && timestamp < new Date('2018/05/01').getTime()) {
                                if ((result[i].remain_count - result[i].out_dayPass.length) == 0) {
                                    if (((Math.floor(result[i].out_dayPass[result[i].out_dayPass.length - 1] / env_config.timeofday) - Math.floor(timestamp / env_config.timeofday)) == 0)) {
                                        temp.complementry_pass_count = 1;
                                    }
                                }
                                else {
                                    temp.complementry_pass_count = 1;
                                }

                            }
                            break;
                        case "season":
                            // if(timestamp >= result[i].from)
                            // {
                            if (result[i].season_status == "freeze" && timestamp >= new Date(result[i].freeze_from).getTime() && timestamp <= new Date(result[i].freeze_to).getTime()) {
                                console.log("season ignored");
                            }

                            else {
                                temp.season_pass = "enable";
                            }
                            // }
                            break;
                        case "multi":

                            if (result[i].remain_count >= 0 && timestamp >= result[i].from && timestamp <= result[i].to) {
                                temp.multi_pass_count = result[i].remain_count;

                            }
                            break;
                        case "day":
                            if (result[i].remain_count >= 0 && timestamp >= result[i].from && timestamp <= result[i].to) {
                                temp.day_pass_count = result[i].remain_count;
                            }
                            break;
                    }
                }

                return_obj.push(temp);

                if (return_obj.length == users.length) {
                    const fields = ['user_phoneNumber', 'firstName', 'familyName', 'birthDate', 'gender', 'guardian_name', 'guardian_phoneNumber', 'guardian_relationship',
                        'emergency_name', 'emergency_phoneNumber', 'emergency_relationship', 'picture_avatar', 'picture_sign', 'pdf_url', 'signup_date', 'season_pass', 'day_pass_count', 'multi_pass_count', 'complementry_pass_count'];
                    const opts = { fields };

                    try {
                        const parser = new Json2csvParser(opts);
                        const csv = parser.parse(return_obj);
                        console.log(csv);
                        return res.status(200).json({
                            result: 1,
                            url: csv
                        });
                    } catch (err) {
                        console.error(err);
                    }
                }
            });
        }


        // const fields = ['user_phoneNumber', 'firstName', 'familyName', 'birthDate', 'gender', 'guardian_name', 'guardian_phoneNumber', 'guardian_relationship',
        //     'emergency_name', 'emergency_phoneNumber', 'emergency_relationship', 'picture_avatar', 'picture_sign', 'pdf_url', 'signup_date', 'season_pass', 'day_pass_count', 'multi_pass_count', 'complementry_pass_count'];
        // const opts = { fields };

        // try {
        //     const parser = new Json2csvParser(opts);
        //     const csv = parser.parse(return_obj);
        //     console.log(csv);
        //     return res.status(200).json({
        //         result: 1,
        //         url: csv
        //     });
        // } catch (err) {
        //     console.error(err);
        // }
    });

}

exports.temp_schedule = function (current_day, users, passes) {

    if (schedule_count < passes.length) {
        admin.real_schedule(current_day, users, passes[schedule_count], function () {
            admin.temp_schedule(current_day, users, passes);
        });
    }
}

exports.switch_plan = async function (subscription_id) {
    const temp_subscription = await stripe.subscriptions.retrieve(subscription_id);

    stripe.subscriptions.update(subscription_id, {
        items: [{
            id: temp_subscription.items.data[0].id,
            plan: 'cima_monthly2',
        }]
    });
}

exports.real_schedule = function (current_day, users, pass, callback) {

    if (new Date(pass.from).getDate() == 1) {
        if ((new Date(current_day).getMonth() - new Date(pass.from).getMonth()) == 1) {

            var subscription_id = "";
            var stripe_customer_id = "";

            for (var i = 0; i < users.length; i++) {
                if (pass.user_id == users[i].id) {
                    subscription_id = users[i].stripe_subscriptionid;
                    stripe_customer_id = users[i].stripe_customerid;
                }
            }

            if (subscription_id == "") {
                if (stripe_customer_id != "") {
                    stripe.subscriptions.create({
                        customer: stripe_customer_id,
                        plan: "cima-monthly",
                    }, function (err, subscription) {
                        if (err == null) {
                            var updateData = {
                                stripe_subscriptionid: subscription.id
                            }


                            model_user.findOneAndUpdate({ user_token: req.body.user_token }, { $set: updateData }, { new: true }, function (err, user) {
                                if (err) {
                                    return res.status(500).send({ message: err.message });
                                }

                                admin.schedule_count++;
                                callback();
                            });
                        }
                        else {
                            admin.schedule_count++;
                            callback();
                        }
                    });
                }
                else {
                    admin.schedule_count++;
                    callback();
                }
            }
            else {
                admin.schedule_count++;
                callback();
            }

        }

        else if ((new Date(current_day).getMonth() - new Date(pass.from).getMonth()) > 1) {
            var subscription_id = "";
            for (var i = 0; i < users.length; i++) {
                if (pass.user_id == users[i].id) {
                    subscription_id = users[i].stripe_subscriptionid;
                }
            }

            if (subscription_id != "") {
                if (current_day == pass.terminate && pass.season_status == "terminate") {
                    stripe.subscriptions.del(
                        subscription_id,
                        function (err, confirmation) {
                            if (err) {
                                admin.schedule_count++;
                                callback();
                                console.log("subscription delete error 1", err);
                            }
                            else {
                                var update_user = {
                                    stripe_subscriptionid: ""
                                }
                                model_user.findOneAndUpdate({ _id: pass.user_id }, { $set: update_user }, { new: true }, function (err, user) {
                                    if (err) {
                                        admin.schedule_count++;
                                        callback();
                                        console.log("user update error 1", err)
                                    }
                                    else {
                                        try {
                                            model_pass.find({ user_id: user.id, pass_type: "season" }).remove().exec();
                                        } catch (e) {
                                            console.log(e);
                                        }
                                        admin.schedule_count++;
                                        callback();
                                    }
                                });
                            }
                        }
                    );
                }
                else if (current_day == pass.freeze_from && pass.season_status == "freeze") {
                    stripe.subscriptions.update(
                        subscription_id,
                        { trial_end: new Date(pass.freeze_to).getTime() },
                        function (err, subscription) {
                            if (err) {
                                console.log("subscription freeze error 1", err)
                                admin.schedule_count++;
                                callback();
                            }
                            else {
                                admin.schedule_count++;
                                callback();
                            }
                        }
                    );
                }
                else {
                    admin.schedule_count++;
                    callback();
                }
            }

            else {
                admin.schedule_count++;
                callback();
            }
        }
    }

    else {
        if ((new Date(current_day).getMonth() - new Date(pass.from).getMonth()) == 2) {

            var subscription_id = "";
            var stripe_customer_id = "";

            for (var i = 0; i < users.length; i++) {
                if (pass.user_id == users[i].id) {
                    subscription_id = users[i].stripe_subscriptionid;
                    stripe_customer_id = users[i].stripe_customerid;
                }
            }

            if (subscription_id == "") {
                if (stripe_customer_id != "") {
                    stripe.subscriptions.create({
                        customer: stripe_customer_id,
                        plan: "cima-monthly",
                    }, function (err, subscription) {
                        if (err == null) {
                            var updateData = {
                                stripe_subscriptionid: subscription.id
                            }


                            model_user.findOneAndUpdate({ user_token: req.body.user_token }, { $set: updateData }, { new: true }, function (err, user) {
                                if (err) {
                                    return res.status(500).send({ message: err.message });
                                }

                                admin.schedule_count++;
                                callback();
                            });
                        }
                        else {
                            admin.schedule_count++;
                            callback();
                        }
                    });
                }
                else {
                    admin.schedule_count++;
                    callback();
                }
            }
            else {
                admin.schedule_count++;
                callback();
            }

        }

        else if ((new Date(current_day).getMonth() - new Date(pass.from).getMonth()) > 2) {
            var subscription_id = "";
            for (var i = 0; i < users.length; i++) {
                if (pass.user_id == users[i].id) {
                    subscription_id = users[i].stripe_subscriptionid;
                }
            }

            if (subscription_id != "") {
                if (current_day == pass.terminate && pass.season_status == "terminate") {
                    stripe.subscriptions.del(
                        subscription_id,
                        function (err, confirmation) {
                            if (err) {
                                admin.schedule_count++;
                                callback();
                                console.log("subscription delete error 1", err);
                            }
                            else {
                                var update_user = {
                                    stripe_subscriptionid: ""
                                }
                                model_user.findOneAndUpdate({ _id: pass.user_id }, { $set: update_user }, { new: true }, function (err, user) {
                                    if (err) {
                                        admin.schedule_count++;
                                        callback();
                                        console.log("user update error 1", err)
                                    }
                                    else {
                                        try {
                                            model_pass.find({ user_id: user.id, pass_type: "season" }).remove().exec();
                                        } catch (e) {
                                            console.log(e);
                                        }
                                        admin.schedule_count++;
                                        callback();
                                    }
                                });
                            }
                        }
                    );
                }
                else if (current_day == pass.freeze_from && pass.season_status == "freeze") {
                    stripe.subscriptions.update(
                        subscription_id,
                        { trial_end: new Date(pass.freeze_to).getTime() },
                        function (err, subscription) {
                            if (err) {
                                console.log("subscription freeze error 1", err)
                                admin.schedule_count++;
                                callback();
                            }
                            else {
                                admin.schedule_count++;
                                callback();
                            }
                        }
                    );
                }
                else {
                    admin.schedule_count++;
                    callback();
                }
            }

            else {
                admin.schedule_count++;
                callback();
            }
        }

        else {
            admin.schedule_count++;
            callback();
        }
    }


}

exports.expiring_subscription = function (req, res) {
    if (req.body.type == "customer.subscription.deleted") {
        console.log("*******subscription_id:", req.body.data.object.id);
        model_user.findOne({ stripe_subscriptionid: req.body.data.object.id }, function (err, result) {
            if (err) {
                console.log("error");
                return res.status(200).json({
                    result: 0
                });
            }
            console.log("customer info:", result);

            if (result == null) {
                console.log("no result");
                return res.status(200).json({
                    result: 0
                });
            }


            var customer_id = result.id;

            try {
                model_pass.find({ user_id: customer_id, pass_type: "season" }).remove().exec();
            } catch (e) {
                console.log(e);
            }

            var updateData = {
                stripe_subscriptionid: ""
            }


            model_user.findOneAndUpdate({ _id: customer_id }, { $set: updateData }, { new: true }, function (err, user) {
                if (err) {
                    console.log("no update");
                    return res.status(500).send({ message: err.message });
                }
                return res.status(200).json({
                    result: 1
                });
            });
        });
    }
    else {
        return res.status(200).json({
            result: 1
        });
    }
}