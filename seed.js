'use strict';

require('rootpath')();
require('dotenv').config({path: __dirname + '/.env'});

var mongoose =  require('mongoose');
var env_config = require('server/config/development');
var model_admin = require('server/app/models/admin.model');
var model_equipment = require('server/app/models/equipment.model');
var service = require('server/app/controllers/service.controller');

var md5 = require('md5');

mongoose.connect(env_config.db, function(err, db)
{
    if(err)
    {
        console.log("db connect error!");
        return;
    }
    console.log("---->Database connected successfully..." + env_config.db);

    // Define User schema model with 3 fields: user, email, password
    var admin = new model_admin({
        name: "Andy Tan",
        user_name: "Andy",
        user_password: md5('dot@king'),
        user_email: 'admin@admin.com',
        role: "Admin",
        user_token: service.token_generator(),
    });

    admin.save(function(err, result) {
        if (err) {
            console.log("admin save error!");
            return;
        }
        console.log("admin save success!")
    });

    var admin = new model_admin({
        name: "Shi Mei",
        user_name: "Shi",
        user_password: md5('dragonking'),
        user_email: 'staff@staff.com',
        role: "Staff",
        user_token: service.token_generator(),   
    });


    admin.save(function(err, result) {
        if (err) {
            console.log("admin save error!");
            return;
        }
        console.log("admin save success!")
    });

    var equipment = new model_equipment({
        type: 'shoe',
        size: ["2.0","2.5","3.0","3.5","4.0","4.5","5.0","5.5","6.0","6.5","6.5","7.0","7.5","8.0","8.5","9.0","9.5","10.0","10.5","11.0","11.5","12.0", "12.5", "13.0", "13.5", "14.0"],
        price: 5,
        quantity: 10000
    });

    equipment.save(function(err, result) {
        if (err) {
            console.log("equipment save error!");
            return;
        }
        console.log("equipment save success!")
    });

    var equipment3 = new model_equipment({
        type: 'sock',
        size: [],
        quantity: 10000,
        price: 2
    });

    equipment3.save(function(err, result) {
        if (err) {
            console.log("equipment3 save error!");
            return;
        }
        console.log("equipment3 save success!")
    });
    
    var equipment5 = new model_equipment({
        type: 'chalkbag',
        size: [],
        quantity: 10000,
        price: 0
    });

    equipment5.save(function(err, result) {
        if (err) {
            console.log("equipment5 save error!");
            return;
        }
        console.log("equipment5 save success!")
    });
    
   

    var equipment7 = new model_equipment({
        type: 'multi',
        size: [],
        quantity: 100000,
        price10: 160,
        price5: 90,
        price: 0
    });

    equipment7.save(function(err, result) {
        if (err) {
            console.log("equipment6 save error!");
            return;
        }
        console.log("equipment6 save success!")
    });

    var equipment8 = new model_equipment({
        type: 'day',
        size: [],
        quantity: 0,
        price: 22,
    });

    equipment8.save(function(err, result) {
        if (err) {
            console.log("equipment6 save error!");
            return;
        }
        console.log("equipment6 save success!")
    });

    var equipment9 = new model_equipment({
        type: 'season',
        size: [],
        quantity: 0,
        price: 60,
        onetime_fee: 100
    });

    equipment9.save(function(err, result) {
        if (err) {
            console.log("equipment6 save error!");
            return;
        }
        console.log("equipment6 save success!")
    });
});

