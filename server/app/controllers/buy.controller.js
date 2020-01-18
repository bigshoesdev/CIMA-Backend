'use strict';

require('rootpath')();
var model_user = require('server/app/models/user.model');
var model_pass = require('server/app/models/pass.model');
var model_purchase = require('server/app/models/purchase.model');
var model_gear = require('server/app/models/gear.model');
var model_equipment = require('server/app/models/equipment.model');

var dateFormat = require('dateformat');

var service = require('server/app/controllers/service.controller');

var admin = require('server/app/controllers/admin.controller');

var env_config = require('server/config/development');
var stripe = require('stripe')(env_config.stripe_apiKey);

var md5 = require('md5');
var buy = this;
var callback_count;

exports.buyPass = function(user_id, timestamp, checkout, res, checkout_result, callback)
{
    var current_time_stamp = new Date().getTime();
    switch(checkout.pass_type)
    {
        case "season":
            model_pass.aggregate(
                {
                    $match: {
                        user_id: user_id,
                        pass_type: checkout.pass_type
                    }
                },
                
                function (err, result) {
                    if(result.length == 0)
                    {
                        var pass = new model_pass({
                            user_id: user_id,
                            pass_type: checkout.pass_type,
                            from: checkout.from,
                            to: checkout.to,
                            remain_count: 1
                        });

                        pass.save(function(err, result) {
                            if (err) {
                                return res.status(500).send({ message: err.message });
                            }
                            model_purchase.aggregate(
                                {
                                    $match: {
                                        user_id: user_id
                                    }
                                },
                                
                                function (err, result) {
                                    
                                    if(result.length == 0)
                                    {
                                        var detail = [];

                                        var temp = {
                                            type: checkout.pass_type,
                                            quantity: 1,
                                            message: "Season Pass",
                                            fullfilled: false,
                                            timestamp: current_time_stamp,
                                        }
                
                                        detail.push(temp);
                                    
                                        var purchase = new model_purchase(
                                            {
                                                user_id: user_id,
                                                timestamp: timestamp,
                                                detail: detail
                                            }
                                        );
                
                                        purchase.save(function(err, result) {
                                            if (err) {
                                                return res.status(500).send({ message: err.message });
                                            }
                                            callback_count ++ ;
                                            callback(checkout_result);
                                        });
                
                                    }
                                    else
                                    {
                                        var flag = false;

                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                flag = true
                                        }

                                        if(flag == false)
                                        {
                                            var detail = [];

                                            var temp = {
                                                type: checkout.pass_type,
                                                quantity: 1,
                                                message: "Season Pass",
                                                fullfilled: false,
                                                timestamp: current_time_stamp,
                                            }
                    
                                            detail.push(temp);
                                        
                                            var purchase = new model_purchase(
                                                {
                                                    user_id: user_id,
                                                    timestamp: timestamp,
                                                    detail: detail
                                                }
                                            );
                    
                                            purchase.save(function(err, result) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                callback_count ++ ;
                                                callback(checkout_result);
                                            });
                                        }
                                        else
                                        {
                                            var season_flag = false;
                                            for(var i = 0; i < result.length; i++)
                                            {
                                                if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                {
                                                    for(var j = 0 ; j < result[i].detail.length; j++)
                                                    {
                                                        if(result[i].detail[j].type == "season")
                                                        {
                                                            season_flag == true;
                                                            
                                                        }
                                                    }
                                                }
                                            }
                                            if(season_flag == false)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        var temp = {
                                                            type: checkout.pass_type,
                                                            quantity: 1,
                                                            message: "Season Pass",
                                                            fullfilled: false,
                                                            timestamp: current_time_stamp,
                                                        };
                                                        timestamp = result[i].timestamp;
                                                        result[i].detail.push(temp);
                                                        model_purchase.findOneAndUpdate({user_id: user_id, timestamp: timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            callback_count ++ ;
                                                            callback(checkout_result);
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
                    }
                }
            );
            break;

        case "multi":
            model_pass.aggregate(
                {
                    $match: {
                        user_id: user_id,
                        pass_type: checkout.pass_type
                    }
                },
                function (err, result) {
                    if(result.length == 0)
                    {
                        var pass = new model_pass({
                            user_id: user_id,
                            pass_type: checkout.pass_type,
                            from: checkout.from,
                            to: checkout.to,
                            remain_count: checkout.count
                        });

                        pass.save(function(err, result) {
                            if (err) {
                                return res.status(500).send({ message: err.message });
                            }
                            model_purchase.aggregate(
                                {
                                    $match: {
                                        user_id: user_id
                                    }
                                },
                                function(err, result)
                                {
                                    if(result.length == 0)
                                    {                                    
                                        var purchase = new model_purchase(
                                            {
                                                user_id: user_id,
                                                timestamp: timestamp,
                                                detail: checkout.purchase
                                            }
                                        );
                
                                        purchase.save(function(err, result) {
                                            if (err) {
                                                return res.status(500).send({ message: err.message });
                                            }
                                            callback_count ++ ;
                                            callback(checkout_result);
                                        });
                                    }
                                    else
                                    {
                                        var flag = false;

                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                flag = true
                                        }

                                        if(flag == false)
                                        {
                                            var purchase = new model_purchase(
                                                {
                                                    user_id: user_id,
                                                    timestamp: timestamp,
                                                    detail: checkout.purchase
                                                }
                                            );
                    
                                            purchase.save(function(err, result) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                callback_count ++ ;
                                                callback(checkout_result);
                                            });
                                        }
                                        else
                                        {
                                            var multi5_count = 0;
                                            var multi10_count = 0;
                                            for(var i = 0; i < result.length; i++)
                                            {
                                                if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                {
                                                    for(var j = 0 ; j < result[i].detail.length; j++)
                                                    {
                                                        if(result[i].detail[j].type == "multi_5")
                                                        {
                                                            multi5_count ++ ;
                                                        }
    
                                                        if(result[i].detail[j].type == "multi_10")
                                                        {
                                                            multi10_count ++;
                                                        }
                                                    
                                                    }
                                                }
                                            }
                                            if(multi5_count == 0 && multi10_count == 0)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var l = 0; l < checkout.purchase.length; l++)
                                                            result[i].detail.push(checkout.purchase[l]);
                                                        model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            callback_count ++ ;
                                                            callback(checkout_result);     
                                                        });
                                                        break;
                                                    }
                                                }
                                            }
                                            else if(multi5_count == 0 && multi10_count > 0)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            for(var k = 0; k < checkout.purchase.length; k++)
                                                            {
                                                                if(checkout.purchase[k].type == "multi_5")
                                                                {
                                                                    result[i].detail.push(checkout.purchase[k]);
                                                                }
                                                            }
                                                          
                                                            if(result[i].detail[j].type == "multi_10")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_10")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("10 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                        
                                                        }
                                                    }
        
                                                    model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                        if (err) {
                                                            return res.status(500).send({ message: err.message });
                                                        }
                                                        callback_count ++ ;
                                                        callback(checkout_result);     
                                                    });
                                                    break;
                                                }
                                            }
                                            else if(multi5_count > 0 && multi10_count == 0)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            for(var k = 0; k < checkout.purchase.length; k++)
                                                            {
                                                                if(checkout.purchase[k].type == "multi_10")
                                                                {
                                                                    result[i].detail.push(checkout.purchase[k]);
                                                                }
                                                            }
                                                          
                                                            if(result[i].detail[j].type == "multi_5")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_5")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("5 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                        
                                                        }
                                                    }
        
                                                    model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                        if (err) {
                                                            return res.status(500).send({ message: err.message });
                                                        }
                                                        callback_count ++ ;
                                                        callback(checkout_result);     
                                                    });
                                                    break;
                                                }
                                            }
                                            else
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            if(result[i].detail[j].type == "multi_10")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_10")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("10 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                          
                                                            if(result[i].detail[j].type == "multi_5")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_5")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("5 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                        
                                                        }
                                                    }
        
                                                    model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                        if (err) {
                                                            return res.status(500).send({ message: err.message });
                                                        }
                                                        callback_count ++ ;
                                                        callback(checkout_result);     
                                                    });
                                                    break;
                                                }
                                            }
                                           
                                        }
                                       
                                    }
                                }
                            );
                        });
                    }
                    else
                    {
                        var updateData = {
                            user_id: user_id,
                            pass_type: checkout.pass_type,
                            from: (checkout.from < result[0].from) ? checkout.from : result[0].from,
                            to: (checkout.to < result[0].to) ? checkout.to : result[0].to,
                            remain_count: checkout.count + result[0].remain_count
                        };
                        model_pass.findOneAndUpdate({user_id: user_id, pass_type: checkout.pass_type}, {$set: updateData}, {new: true},  function(err, user){
                            if (err) {
                                return res.status(500).send({ message: err.message });
                            }
                            model_purchase.aggregate(
                                {
                                    $match: {
                                        user_id: user_id
                                    }
                                },
                                function(err, result)
                                {
                                    if(result.length == 0)
                                    {                                    
                                        var purchase = new model_purchase(
                                            {
                                                user_id: user_id,
                                                timestamp: timestamp,
                                                detail: checkout.purchase
                                            }
                                        );
                
                                        purchase.save(function(err, result) {
                                            if (err) {
                                                return res.status(500).send({ message: err.message });
                                            }
                                            callback_count ++ ;
                                            callback(checkout_result);
                                        });
                                    }
                                    else
                                    {
                                        var flag = false;
    
                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                flag = true
                                        }
    
                                        if(flag == false)
                                        {
                                            var purchase = new model_purchase(
                                                {
                                                    user_id: user_id,
                                                    timestamp: timestamp,
                                                    detail: checkout.purchase
                                                }
                                            );
                    
                                            purchase.save(function(err, result) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                callback_count ++ ;
                                                callback(checkout_result);
                                            });
                                        }
                                        else
                                        {
                                            var multi5_count = 0;
                                            var multi10_count = 0;
                                            for(var i = 0; i < result.length; i++)
                                            {
                                                if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                {
                                                    for(var j = 0 ; j < result[i].detail.length; j++)
                                                    {
                                                        if(result[i].detail[j].type == "multi_5")
                                                        {
                                                            multi5_count ++ ;
                                                        }
    
                                                        if(result[i].detail[j].type == "multi_10")
                                                        {
                                                            multi10_count ++;
                                                        }
                                                    
                                                    }
                                                }
                                            }
                                            if(multi5_count == 0 && multi10_count == 0)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var l = 0; l < checkout.purchase.length; l++)
                                                            result[i].detail.push(checkout.purchase[l]);
                                                        model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            callback_count ++ ;
                                                            callback(checkout_result);     
                                                        });
                                                        break;
                                                    }
                                                }
                                            }
                                            else if(multi5_count == 0 && multi10_count > 0)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            for(var k = 0; k < checkout.purchase.length; k++)
                                                            {
                                                                if(checkout.purchase[k].type == "multi_5")
                                                                {
                                                                    result[i].detail.push(checkout.purchase[k]);
                                                                }
                                                            }
                                                          
                                                            if(result[i].detail[j].type == "multi_10")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_10")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("10 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                        
                                                        }
                                                    }
        
                                                    model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                        if (err) {
                                                            return res.status(500).send({ message: err.message });
                                                        }
                                                        callback_count ++ ;
                                                        callback(checkout_result);     
                                                    });
                                                    break;
                                                }
                                            }
                                            else if(multi5_count > 0 && multi10_count == 0)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            for(var k = 0; k < checkout.purchase.length; k++)
                                                            {
                                                                if(checkout.purchase[k].type == "multi_10")
                                                                {
                                                                    result[i].detail.push(checkout.purchase[k]);
                                                                }
                                                            }
                                                          
                                                            if(result[i].detail[j].type == "multi_5")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_5")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("5 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                        
                                                        }
                                                    }
        
                                                    model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                        if (err) {
                                                            return res.status(500).send({ message: err.message });
                                                        }
                                                        callback_count ++ ;
                                                        callback(checkout_result);     
                                                    });
                                                    break;
                                                }
                                            }
                                            else
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            if(result[i].detail[j].type == "multi_10")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_10")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("10 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                          
                                                            if(result[i].detail[j].type == "multi_5")
                                                            {
                                                                
                                                                for(var k = 0; k < checkout.purchase.length; k++)
                                                                {
                                                                    if(checkout.purchase[k].type == "multi_5")
                                                                    {
                                                                        result[i].detail[j].quantity += checkout.purchase[k].quantity;
                                                                        result[i].detail[j].message = ("5 Pass" + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                                    }
                                                                }
                                                            }
                                                        
                                                        }
                                                    }
        
                                                    model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                        if (err) {
                                                            return res.status(500).send({ message: err.message });
                                                        }
                                                        callback_count ++ ;
                                                        callback(checkout_result);     
                                                    });
                                                    break;
                                                }
                                            }
                                           
                                        }
                                        
                                    }
                                }
                            );      
                        });
                    }
                }
            );
            break;
        case "day":
            model_pass.aggregate(
                {
                    $match: {
                        user_id: user_id,
                        pass_type: checkout.pass_type
                    }
                },
                
                function (err, result) {
                    if(result.length == 0)
                    {
                        var pass = new model_pass({
                            user_id: user_id,
                            pass_type: checkout.pass_type,
                            from: checkout.from,
                            to: checkout.to,
                            remain_count: checkout.quantity
                        });

                        pass.save(function(err, result) {
                            if (err) {
                                return res.status(500).send({ message: err.message });
                            }
                            model_purchase.aggregate(
                                {
                                    $match: {
                                        user_id: user_id
                                    }
                                },
                                
                                function (err, result) {
                                    if(result.length == 0)
                                    {
                                        var detail = [];

                                        var temp = {
                                            type: checkout.pass_type,
                                            quantity: checkout.quantity,
                                            message: "Day Pass" +  ((checkout.quantity > 1) ? (" * " + checkout.quantity) : ""),
                                            fullfilled: false,
                                            timestamp: current_time_stamp,
                                        }
                
                                        detail.push(temp);
                                    
                                        var purchase = new model_purchase(
                                            {
                                                user_id: user_id,
                                                timestamp: timestamp,
                                                detail: detail
                                            }
                                        );
                
                                        purchase.save(function(err, result) {
                                            if (err) {
                                                return res.status(500).send({ message: err.message });
                                            }
                                            callback_count ++ ;
                                            callback(checkout_result);
                                        });
                
                                    }
                                    else
                                    {
                                        var flag = false;

                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                flag = true
                                        }

                                        if(flag == false)
                                        {
                                            var detail = [];

                                            var temp = {
                                                type: checkout.pass_type,
                                                quantity: checkout.quantity,
                                                message: "Day Pass" +  ((checkout.quantity > 1) ? (" * " + checkout.quantity) : ""),
                                                fullfilled: false,
                                                timestamp: current_time_stamp,
                                            }
                    
                                            detail.push(temp);
                                        
                                            var purchase = new model_purchase(
                                                {
                                                    user_id: user_id,
                                                    timestamp: timestamp,
                                                    detail: detail
                                                }
                                            );
                    
                                            purchase.save(function(err, result) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                callback_count ++ ;
                                                callback(checkout_result);
                                            });
                                        }
                                        else
                                        {
                                            var day_flag = false;
                                            for(var i = 0; i < result.length; i++)
                                            {
                                                if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                {
                                                    for(var j = 0 ; j < result[i].detail.length; j++)
                                                    {
                                                        if(result[i].detail[j].type == "day")
                                                        {
                                                            day_flag == true;
                                                            
                                                        }
                                                    }
                                                }
                                            }
                                            if(day_flag == false)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        
                                                        var temp = {
                                                            type: checkout.pass_type,
                                                            quantity: checkout.quantity,
                                                            message: "Day Pass" +  ((checkout.quantity > 1) ? (" * " + checkout.quantity) : ""),
                                                            fullfilled: false,
                                                            timestamp: current_time_stamp,
                                                        }
                                                        timestamp = result[i].timestamp;
                                                        result[i].detail.push(temp);
                                                        model_purchase.findOneAndUpdate({user_id: user_id, timestamp: timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            callback_count ++ ;
                                                            callback(checkout_result);
                                                        });
                                                        break;
                                                    
                                                    }

                                                }
                                            }
                                            else
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            if(result[i].detail[j].type == "day")
                                                            {
                                                                var temp = {
                                                                    type: checkout.pass_type,
                                                                    quantity: result[i].detail[j].quantity + checkout.quantity,
                                                                    message: "Day Pass" +  (((result[i].detail[j].quantity + checkout.quantity) > 1) ? (" * " + (result[i].detail[j].quantity + checkout.quantity)) : ""),
                                                                    fullfilled: false,
                                                                    timestamp: current_time_stamp,
                                                                }
                                                                result[i].detail[j] = temp;
                                                            }
                                                            
                                                        }
                                                        model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            callback_count ++ ;
                                                            callback(checkout_result);
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
                    }
                    else
                    {
                        var updateData = {
                            user_id: user_id,
                            pass_type: checkout.pass_type,
                            from: (checkout.from < result[0].from) ? checkout.from : result[0].from,
                            to: (checkout.to < result[0].to) ? checkout.to : result[0].to,
                            remain_count: checkout.quantity + result[0].remain_count
                        };
                        model_pass.findOneAndUpdate({user_id: user_id, pass_type: checkout.pass_type}, {$set: updateData}, {new: true},  function(err, user){
                            if (err) {
                                return res.status(500).send({ message: err.message });
                            }
                            model_purchase.aggregate(
                                {
                                    $match: {
                                        user_id: user_id
                                    }
                                },
                                
                                function (err, result) {
                                    if(result.length == 0)
                                    {
                                        var detail = [];

                                        var temp = {
                                            type: checkout.pass_type,
                                            quantity: checkout.quantity,
                                            message: "Day Pass" + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : ""),
                                            fullfilled: false,
                                            timestamp: current_time_stamp,
                                        }
                
                                        detail.push(temp);
                                    
                                        var purchase = new model_purchase(
                                            {
                                                user_id: user_id,
                                                timestamp: timestamp,
                                                detail: detail
                                            }
                                        );
                
                                        purchase.save(function(err, result) {
                                            if (err) {
                                                return res.status(500).send({ message: err.message });
                                            }
                                            callback_count ++ ;
                                            callback(checkout_result);
                                        });
                
                                    }
                                    else
                                    {
                                        var flag = false;

                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                flag = true
                                        }

                                        if(flag == false)
                                        {
                                            var detail = [];

                                            var temp = {
                                                type: checkout.pass_type,
                                                quantity: checkout.quantity,
                                                message: "Day Pass" +  ((checkout.quantity > 1) ? (" * " + checkout.quantity) : ""),
                                                fullfilled: false,
                                                timestamp: current_time_stamp,
                                            }
                    
                                            detail.push(temp);
                                        
                                            var purchase = new model_purchase(
                                                {
                                                    user_id: user_id,
                                                    timestamp: timestamp,
                                                    detail: detail
                                                }
                                            );
                    
                                            purchase.save(function(err, result) {
                                                if (err) {
                                                    return res.status(500).send({ message: err.message });
                                                }
                                                callback_count ++ ;
                                                callback(checkout_result);
                                            });
                                        }
                                        else
                                        {
                                            var day_flag = false;
                                            for(var i = 0; i < result.length; i++)
                                            {
                                                if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                {
                                                    for(var j = 0 ; j < result[i].detail.length; j++)
                                                    {
                                                        if(result[i].detail[j].type == "day")
                                                        {
                                                            day_flag = true;
                                                            
                                                        }
                                                    }
                                                }
                                            }
                                            if(day_flag == false)
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        
                                                        var temp = {
                                                            type: checkout.pass_type,
                                                            quantity: checkout.quantity,
                                                            message: "Day Pass" +  ((checkout.quantity > 1) ? (" * " + checkout.quantity) : ""),
                                                            fullfilled: false,
                                                            timestamp: current_time_stamp,
                                                        }
                                                        timestamp = result[i].timestamp;
                                                        result[i].detail.push(temp);
                                                        model_purchase.findOneAndUpdate({user_id: user_id, timestamp: timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            callback_count ++ ;
                                                            callback(checkout_result);
                                                        });
                                                        break;
                                                    
                                                    }

                                                }
                                            }
                                            else
                                            {
                                                for(var i = 0; i < result.length; i++)
                                                {
                                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                                    {
                                                        for(var j = 0 ; j < result[i].detail.length; j++)
                                                        {
                                                            if(result[i].detail[j].type == "day")
                                                            {
                                                                var temp = {
                                                                    type: checkout.pass_type,
                                                                    quantity: result[i].detail[j].quantity + checkout.quantity,
                                                                    message: "Day Pass" +  (((result[i].detail[j].quantity + checkout.quantity) > 1) ? (" * " + (result[i].detail[j].quantity + checkout.quantity)) : ""),
                                                                    fullfilled: false,
                                                                    timestamp: current_time_stamp,
                                                                }
                                                                result[i].detail[j] = temp;
                                                            }
                                                            
                                                        }
                                                        model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                            if (err) {
                                                                return res.status(500).send({ message: err.message });
                                                            }
                                                            callback_count ++ ;
                                                            callback(checkout_result);
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
                    }
                }
            );
            break;

    }
}

exports.buyGear = function(user_id, timestamp, checkout, res, checkout_result, callback)
{
    switch(checkout.gear_type)
    {
        case "shoe":
            model_equipment.findOne({ type: checkout.gear_type}, function(err, equipment) {
                if(err)
                {
                    return res.status(200).json({
                        result: 0
                    });
                }

                var updateData = {
                    quantity:  equipment.quantity - checkout.quantity
                }
                model_equipment.findOneAndUpdate({ type: checkout.gear_type}, {$set: updateData}, {new: true},  function(err, equipment){
                    if(err)
                    {
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
                            if(result.length == 0)
                            {
                                var detail = [];
                
                                var temp = {
                                    type: checkout.gear_type,
                                    size: checkout.shoe_size,
                                    quantity: checkout.quantity,
                                    message: ((checkout.shoe_size + ' Shoe Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                    status: "fullfilled",
                                    timestamp: current_time_stamp,
                                    id: "purchase_" + service.token_generator()
                                }
                
                                detail.push(temp);
                
                                var purchase = new model_purchase(
                                    {
                                        user_id: user_id,
                                        timestamp: timestamp,
                                        detail: detail
                                    }
                                );
                
                                purchase.save(function(err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    callback_count ++ ;
                                    callback(checkout_result);
                                });
                
                            }
                            else
                            {
                                var flag = false;
        
                                for(var i = 0; i < result.length; i++)
                                {
                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                    {                             
                                        flag = true;
                                    }
                                } 
                                
                                if(flag == false)
                                {
                                    var detail = [];
                
                                    var temp = {
                                        type: checkout.gear_type,
                                        size: checkout.shoe_size,
                                        quantity: checkout.quantity,
                                        message: ((checkout.shoe_size + ' Shoe Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                        status: "fullfilled",
                                        timestamp: current_time_stamp,
                                        id: "purchase_" + service.token_generator()
                                    }
                    
                                    detail.push(temp);
                    
                                    var purchase = new model_purchase(
                                        {
                                            user_id: user_id,
                                            timestamp: timestamp,
                                            detail: detail
                                        }
                                    );
                    
                                    purchase.save(function(err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        callback_count ++ ;
                                        callback(checkout_result);
                                    });
                                }
                                else
                                {
                                    var shoe_flag = false;
                                    for(var i = 0; i < result.length; i++)
                                    {
                                        if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                        {
                                            for(var j = 0 ; j < result[i].detail.length; j++)
                                            {
                                                if(result[i].detail[j].message.indexOf(checkout.size + ' Shoe Rental') >= 0 && result[i].detail[j].status == "fullfilled")
                                                {
                                                    shoe_flag = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if(shoe_flag == false)
                                    {
                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                            {
                                                var temp = {
                                                    type: checkout.gear_type,
                                                    size: checkout.shoe_size,
                                                    quantity: checkout.quantity,
                                                    message: ((checkout.shoe_size + ' Shoe Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                                    status: "fullfilled",
                                                    timestamp: current_time_stamp,
                                                    id: "purchase_" + service.token_generator()
                                                }
                                
                                                result[i].detail.push(temp);
                                               
                                                model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    callback_count ++ ;
                                                    callback(checkout_result);          
                                                });
        
                                                break;
        
                                            }
                                        }
                                    }
                                    else
                                    {
                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                            {
                                                for(var j = 0 ; j < result[i].detail.length; j++)
                                                {
                                                    if(result[i].detail[j].message.indexOf(checkout.size + ' Shoe Rental') >= 0 && result[i].detail[j].status == "fullfilled")
                                                    {
                                                        result[i].detail[j].quantity += checkout.quantity;
                                                        result[i].detail[j].message = (checkout.shoe_size + ' Shoe Rental' + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                    }
                                                }
        
                                                model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    callback_count ++ ;
                                                    callback(checkout_result);            
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
            model_equipment.findOne({ type: checkout.gear_type}, function(err, equipment) {
                if(err)
                {
                    return res.status(200).json({
                        result: 0
                    });
                }

                var updateData = {
                    quantity:  equipment.quantity - checkout.quantity
                }
                model_equipment.findOneAndUpdate({ type: checkout.gear_type}, {$set: updateData}, {new: true},  function(err, equipment){
                    if(err)
                    {
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
                            if(result.length == 0)
                            {
                                var detail = [];
                
                                var temp = {
                                    type: checkout.gear_type,
                                    size: checkout.sock_size,
                                    quantity: checkout.quantity,
                                    message: (('Socks') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                    status: "fullfilled",
                                    timestamp: current_time_stamp,
                                    id: "purchase_" + service.token_generator()
                                }
                
                                detail.push(temp);
                
                                var purchase = new model_purchase(
                                    {
                                        user_id: user_id,
                                        timestamp: timestamp,
                                        detail: detail
                                    }
                                );
                
                                purchase.save(function(err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    callback_count ++ ;
                                    callback(checkout_result);
                                });
                
                            }
                            else
                            {
                                var flag = false;
        
                                for(var i = 0; i < result.length; i++)
                                {
                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                    {                             
                                        flag = true;
                                    }
                                } 
                                
                                if(flag == false)
                                {
                                    var detail = [];
                
                                    var temp = {
                                        type: checkout.gear_type,
                                        size: checkout.sock_size,
                                        quantity: checkout.quantity,
                                        message: (('Socks') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                        status: "fullfilled",
                                        timestamp: current_time_stamp,
                                        id: "purchase_" + service.token_generator()
                                    }
                    
                                    detail.push(temp);
                    
                                    var purchase = new model_purchase(
                                        {
                                            user_id: user_id,
                                            timestamp: timestamp,
                                            detail: detail
                                        }
                                    );
                    
                                    purchase.save(function(err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        callback_count ++ ;
                                        callback(checkout_result);
                                    });
                                }
                                else
                                {
                                    var sock_flag = false;
                                    for(var i = 0; i < result.length; i++)
                                    {
                                        if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                        {
                                            for(var j = 0 ; j < result[i].detail.length; j++)
                                            {
                                                if(result[i].detail[j].type == checkout.gear_type && result[i].detail[j].status == "fullfilled")
                                                {
                                                    sock_flag = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if(sock_flag == false)
                                    {
                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                            {
                                                var temp = {
                                                    type: checkout.gear_type,
                                                    size: checkout.sock_size,
                                                    quantity: checkout.quantity,
                                                    message: (('Socks') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                                    status: "fullfilled",
                                                    timestamp: current_time_stamp,
                                                    id: "purchase_" + service.token_generator()
                                                }
                                
                                                result[i].detail.push(temp);
                                               
                                                model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    callback_count ++ ;
                                                    callback(checkout_result);          
                                                });
        
                                                break;
        
                                            }
                                        }
                                    }
                                    else
                                    {
                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                            {
                                                for(var j = 0 ; j < result[i].detail.length; j++)
                                                {
                                                    if(result[i].detail[j].type == checkout.gear_type && result[i].detail[j].status == "fullfilled")
                                                    {
                                                        result[i].detail[j].quantity += checkout.quantity;
                                                        result[i].detail[j].message = ('Socks' + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                    }
                                                }
        
                                                model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    callback_count ++ ;
                                                    callback(checkout_result);            
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
        case "chalkbag":
            model_equipment.findOne({ type: checkout.gear_type}, function(err, equipment) {
                if(err)
                {
                    return res.status(200).json({
                        result: 0
                    });
                }

                var updateData = {
                    quantity:  equipment.quantity - checkout.quantity
                }
                model_equipment.findOneAndUpdate({ type: checkout.gear_type}, {$set: updateData}, {new: true},  function(err, equipment){
                    if(err)
                    {
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
                            if(result.length == 0)
                            {
                                var detail = [];
                
                                var temp = {
                                    type: checkout.gear_type,
                                    size: "FREE",
                                    quantity: checkout.quantity,
                                    message: (('Chalkbag Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                    status: "fullfilled",
                                    timestamp: current_time_stamp,
                                    id: "purchase_" + service.token_generator()
                                }
                
                                detail.push(temp);
                
                                var purchase = new model_purchase(
                                    {
                                        user_id: user_id,
                                        timestamp: timestamp,
                                        detail: detail
                                    }
                                );
                
                                purchase.save(function(err, result) {
                                    if (err) {
                                        return res.status(500).send({ message: err.message });
                                    }
                                    callback_count ++ ;
                                    callback(checkout_result);
                                });
                
                            }
                            else
                            {
                                var flag = false;
        
                                for(var i = 0; i < result.length; i++)
                                {
                                    if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                    {                             
                                        flag = true;
                                    }
                                } 
                                
                                if(flag == false)
                                {
                                    var detail = [];
                
                                    var temp = {
                                        type: checkout.gear_type,
                                        size: "FREE",
                                        quantity: checkout.quantity,
                                        message: (('Chalkbag Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                        status: "fullfilled",
                                        timestamp: current_time_stamp,
                                        id: "purchase_" + service.token_generator()
                                    }
                    
                                    detail.push(temp);
                    
                                    var purchase = new model_purchase(
                                        {
                                            user_id: user_id,
                                            timestamp: timestamp,
                                            detail: detail,
                                        }
                                    );
                    
                                    purchase.save(function(err, result) {
                                        if (err) {
                                            return res.status(500).send({ message: err.message });
                                        }
                                        callback_count ++ ;
                                        callback(checkout_result);
                                    });
                                }
                                else
                                {
                                    var chalkbag_flag = false;
                                    for(var i = 0; i < result.length; i++)
                                    {
                                        if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                        {
                                            for(var j = 0 ; j < result[i].detail.length; j++)
                                            {
                                                if(result[i].detail[j].type == checkout.gear_type && result[i].detail[j].status == "fullfilled")
                                                {
                                                    chalkbag_flag = true;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    if(chalkbag_flag == false)
                                    {
                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                            {
                                                var temp = {
                                                    type: checkout.gear_type,
                                                    size: "FREE",
                                                    quantity: checkout.quantity,
                                                    message: (('Chalkbag Rental') + ((checkout.quantity > 1) ? (" * " + checkout.quantity) : "")),
                                                    status: "fullfilled",
                                                    timestamp: current_time_stamp,
                                                    id: "purchase_" + service.token_generator()
                                                }
                                
                                                result[i].detail.push(temp);
                                            
                                                model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    callback_count ++ ;
                                                    callback(checkout_result);          
                                                });
        
                                                break;
        
                                            }
                                        }
                                    }
                                    else
                                    {
                                        for(var i = 0; i < result.length; i++)
                                        {
                                            if(Math.floor(result[i].timestamp / env_config.timeofday) == Math.floor(timestamp / env_config.timeofday))
                                            {
                                                for(var j = 0 ; j < result[i].detail.length; j++)
                                                {
                                                    if(result[i].detail[j].type == checkout.gear_type && result[i].detail[j].status == "fullfilled")
                                                    {
                                                        result[i].detail[j].quantity += checkout.quantity;
                                                        result[i].detail[j].message = ('Chalkbag Rental' + ((result[i].detail[j].quantity > 1) ? (" * " + result[i].detail[j].quantity) : ""));
                                                    }
                                                }
        
                                                model_purchase.findOneAndUpdate({user_id: user_id, timestamp: result[i].timestamp}, {$set: result[i]}, {new: true},  function(err, user){
                                                    if (err) {
                                                        return res.status(500).send({ message: err.message });
                                                    }
                                                    callback_count ++ ;
                                                    callback(checkout_result);            
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

exports.validate_season = function(checkout)
{
    for(var i = 0;  i < checkout.length; i++)
    {
        if(checkout[i].type == "pass")
            if(checkout[i].pass_type == "season")
                return true;
    }
    return false;
}

exports.temp_checkout = function(req, res)
{
    var result= [];

    var multi = {
        type : "pass",
        pass_type: "multi",
        from: 0,
        to: 0,
        count: 0,
        purchase: []
    };

    var multi_flag = false;
    for(var i = 0;  i < req.body.checkout.length; i++)
    {
        switch(req.body.checkout[i].type)
        {
            case 'pass':
                switch(req.body.checkout[i].pass_type)
                {
                    case "multi":
                        multi_flag = true;
                        multi.count +=  req.body.checkout[i].count * req.body.checkout[i].quantity;
                        var purchase = {
                            type: "multi_" + req.body.checkout[i].count,
                            quantity: req.body.checkout[i].quantity,
                            message: ((req.body.checkout[i].count + " Pass") + ((req.body.checkout[i].quantity > 1) ? (" * " + req.body.checkout[i].quantity) : "")),
                            fullfilled: false,
                            timestamp: req.body.timestamp,
                        }

                       multi.purchase.push(purchase);
                       multi.from = req.body.checkout[i].from;
                       multi.to = req.body.checkout[i].to;
                }
                break;
        }
    }

    if(multi_flag == true)
        result.push(multi);

    for(var i = 0;  i < req.body.checkout.length; i++)
    {
        switch(req.body.checkout[i].type)
        {
            case 'pass':
                switch(req.body.checkout[i].pass_type)
                {
                    case "season":
                        result.push(req.body.checkout[i]);
                        break;
                    case "day":
                        result.push(req.body.checkout[i]);
                        break;
                }
                break;
            case 'gear':
                result.push(req.body.checkout[i]);
                break;
            case 'course':
                result.push(req.body.checkout[i]);
                break;
        }
    }

    callback_count = 0;
    buy.realcheckout(req, result, res);
    
    return res.status(200).json({
        result: 1   
    });
}


exports.realcheckout = function(req, result, res)
{
    if(callback_count < result.length)
    {
        switch(result[callback_count].type)
        {
            case 'pass':
                buy.buyPass(req.body.user_id, req.body.timestamp, result[callback_count], res, result, function(checkout_result)
                {
                    buy.realcheckout(req, checkout_result, res);
                });
                break;
            case 'gear':
                buy.buyGear(req.body.user_id, req.body.timestamp, result[callback_count], res, result, function(checkout_result)
                {
                    buy.realcheckout(req, checkout_result, res);
                });
                break;
            case 'course':
                // buyCourse(req.body.checkout[i].detail)
                break;
        }
    }
    else
    {
        admin.socket_getPendingRental();
    }
    
}

exports.temp_cancelSubscription = function(user_token, stripe_customerid, stripe_subscriptionid, res)
{
  
    stripe.customers.cancelSubscription(stripe_customerid, stripe_subscriptionid, function(err, confirmation) {
            if(err)
            {
                return res.status(200).json({
                    result: 0,
                    message: err.message
                });
            }

            var updateData = {
                stripe_subscriptionid : ""
            }

            model_user.findOneAndUpdate({user_token: user_token}, {$set: updateData}, {new: true},  function(err, user){
                if (err) {
                    return res.status(500).send({ message: err.message });
                }
                model_pass.find({ user_id: user.id, pass_type: "season" }).remove().exec();
                return res.status(200).json({
                    result: 1
                });
            });            
        }
    );

}

exports.cancel_subscription = function(req, res) {

    model_user.findOne({ user_token: req.body.user_token }, function(err, result) {
        if(err)
        {
            return res.status(200).json({
                result: -1
            });
        }
        buy.temp_cancelSubscription(result.user_token ,result.stripe_customerid, result.stripe_subscriptionid, res);
    });
}

exports.checkout = function(req, res) {

    model_user.findOne({user_token: req.body.user_token }, function(err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1     
            });
        }
        console.log("stating checkout ----");
        // buy.temp_checkout(req, res);
        if(req.body.checkout.length == 1 && req.body.checkout[0].pass_type == "season" && req.body.total_price == 0)
        {
            console.log("buy season pass");

            console.log("stripe_customerid: ", result.stripe_customerid);
            console.log("stripe_subscriptionid: ", result.stripe_subscriptionid);


            if(result.stripe_customerid == "")
            {

                stripe.customers.create({
                    description: 'customer for' + result.firstName + ' ' + result.familyName,
                    source: req.body.stripe_token,
                    email: result.user_email} , function(err, customer)
                    {
                        if(err)
                        {
                            return res.status(200).json({
                                result: 0,
                                message: err.message
                            });
                        }

                        var updateData = {
                            stripe_customerid: customer.id
                        }

                        model_user.findOneAndUpdate({user_token: req.body.user_token}, {$set: updateData}, {new: true},  function(err, user){
                            if (err) {
                                return res.status(500).send({ message: err.message });
                            }

                            console.log("saved stripe_customerid: " +  updateData.stripe_customerid);

                            var season_price = service.getSeasonPrice(req.body.checkout[0].from) * 100;

                            console.log("stripe_season_price: " + season_price);
                            stripe.charges.create({
                                amount: season_price,
                                currency: req.body.currency,
                                description: 'transaction of' + result.firstName + ' ' + result.familyName,
                                customer: updateData.stripe_customerid
                              }, function(err, charge) {
                                    if(err == null)
                                    {
                                        console.log("Seasonpass created.");
                                        buy.temp_checkout(req, res);
                                       
                                        return res.status(200).json({
                                            result: 1,
                                        });
                
                                    }
                                    else
                                    {
                                        console.log("buy Seasonpass failed: " + err.message);
                                        return res.status(200).json({
                                            result: 0,
                                            message: err.message
                                        });
                                    }
                            });
                        });
                    }
                );
            }
            else if(result.stripe_customerid != "" && result.stripe_subscriptionid == "")
            {
                var season_price = service.getSeasonPrice(req.body.checkout[0].from) * 100;

                console.log("stripe_season_price: " + season_price);
                stripe.charges.create({
                    amount: season_price,
                    currency: req.body.currency,
                    description: 'transaction of' + result.firstName + ' ' + result.familyName,
                    customer: result.stripe_customerid
                  }, function(err, charge) {
                        if(err == null)
                        {
                            console.log("Seasonpass created.");

                            buy.temp_checkout(req, res);
                            return res.status(200).json({
                                result: 1,
                            });
    
                        }
                        else
                        {
                            console.log("buy Seasonpass failed: " + err.message);
                            return res.status(200).json({
                                result: 0,
                                message: err.message
                            });
                        }
                });
            }
            else
            {
                console.log("Seasonpass existed.");
                return res.status(200).json({
                    result: 1,
                });
            }
        }

        else
        {
            stripe.charges.create({
                amount: req.body.total_price,
                currency: req.body.currency,
                description: 'transaction of' + result.firstName + ' ' + result.familyName,
                source: req.body.stripe_token
              }, function(err, charge) {
                    if(err == null)
                    {
                        
                        buy.temp_checkout(req, res);
                        return res.status(200).json({
                            result: 1,
                        });

                    }
                    else
                    {
                        return res.status(200).json({
                            result: 0,
                            message: err.message
                        });
                    }
            });
        }
       
    });
      
}       