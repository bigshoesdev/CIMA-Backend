'use strict';

require('rootpath')();
var model_user = require('server/app/models/user.model');
var model_pass = require('server/app/models/pass.model');
var model_gear = require('server/app/models/gear.model');
var model_feedback = require('server/app/models/feedback.model');
var model_history = require('server/app/models/history.model');
var model_qrcode = require('server/app/models/qrcode.model');
var model_purchase = require('server/app/models/purchase.model');
var model_equipment = require('server/app/models/equipment.model');

var env_config = require('server/config/development');

var service = require('server/app/controllers/service.controller');

var nodemailer = require('nodemailer');

var md5 = require('md5');
var moment = require('moment');

var setting = this;

var api_key = 'key-b54a06bea1959e138839f9a1afcb16d0';
var domain = 'o13s.com';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var mailcomposer = require('mailcomposer');


exports.send_email = function(req, res)
{

    model_user.findOne({user_token: req.body.user_token }, function(err, result) {
		if (!result) {
            return res.status(200).json({
                result: -1     
            });
        }

		console.log("admin_email:", env_config.account_email);
        console.log("admin_email_pass:", env_config.email_pass);
        
        var data = {
            from: env_config.account_email,
            to: req.body.email,
            subject: 'VIEW INDEMNITY!',
            text: env_config.server_url + result.pdf_url
        };
        
        mailgun.messages().send(data, function (error, body) {
            if(error)
            {
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

exports.send_feedback = function(req, res)
{
   
    var data = {
        from: req.body.email, 
        to: env_config.account_email,
        subject: req.body.title,
        text: req.body.message
    };
    
    mailgun.messages().send(data, function (error, body) {
        if(error)
        {
            return res.status(200).json({
                result: 0     
            });
        }
        return res.status(200).json({
            result: 1     
        });
    });

    // model_user.findOne({user_token: req.body.user_token }, function(err, result) {
	// 	if (!result) {
    //         return res.status(200).json({
    //             result: -1     
    //         });
    //     }
      
    //     model_feedback.aggregate(
    //         {
    //             $match: {
    //                 user_id: req.body.user_id,
    //                 title: req.body.title,
    //                 message: req.body.message
    //             }
    //         },
            
    //         function (err, result) {
    //            if(result.length == 0)
    //            {
    //                 var feedback = new model_feedback({
    //                     user_id: req.body.user_id,
    //                     title: req.body.title,
    //                     message: req.body.message
    //                 });
                    
    //                 feedback.save(function(err, result) {
    //                     if (err) {
    //                         return res.status(500).send({ message: err.message });
    //                     }
    //                     return res.status(200).json({
    //                         result: 1
    //                     });
    //                 });
    //            }
    //            else
    //            {
    //                 return res.status(200).json({
    //                     result: 0
    //                 });
    //            }
    //         }
    //     );
	// });
    
}

exports.gymin = function(req, res)
{
    model_user.findOne({user_token: req.body.user_token }, function(err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1     
            });
        }
        var decimalcode = service.randDecimal();

        model_qrcode.findOne({decimalcode: decimalcode }, function(err, result) {
            if (!result) {
                var temp = {
                    user_id: req.body.user_id,
                    status: "in",
                    timestamp: req.body.timestamp,
                    pass_type: req.body.pass_type
                }
        
                var detail = JSON.stringify(temp);
        
                var qrcode = new model_qrcode({
                    decimalcode: decimalcode,
                    timestamp: req.body.timestamp,
                    detail: detail
                });
            
                qrcode.save(function(err, result) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }
                    console.log("decimalcode:" , decimalcode);
                    return res.status(200).json({
                        result: 1,
                        decimalcode: decimalcode  
                    });
                });
            }
            else
            {
                setting.gymin(req, res);
            }
        });	
    });	
}

exports.gymout = function(req, res)
{
    model_user.findOne({user_token: req.body.user_token }, function(err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1     
            });
        }
        var decimalcode = service.randDecimal();

        model_qrcode.findOne({decimalcode: decimalcode }, function(err, result) {
            if (!result) {
                var temp = {
                    user_id: req.body.user_id,
                    status: "out",
                    timestamp: req.body.timestamp,
                    pass_type: req.body.pass_type
                }
        
                var detail = JSON.stringify(temp);
        
                var qrcode = new model_qrcode({
                    decimalcode: decimalcode,
                    timestamp: req.body.timestamp,
                    detail: detail
                });
            
                qrcode.save(function(err, result) {
                    if (err) {
                        return res.status(500).send({ message: err.message });
                    }
                    console.log("decimalcode:" , decimalcode);
                    return res.status(200).json({
                        result: 1,
                        decimalcode: decimalcode  
                    });
                });
            }
            else
            {
                setting.gymout(req, res);
            }
        });	
    });
}


exports.validate_turnstile = function(req, res)
{
    model_user.findOne({user_token: req.body.user_token }, function(err, result) {
		if (!result) {
            return res.status(200).json({
                result: -1     
            });
        }
      
        model_history.aggregate(
            {
                $match: {
                    user_id: req.body.user_id
                }
            },
            
            function (err, result) {
               if(result.length == 0)
               {
                    return res.status(200).json({
                        result: 0
                    });
               }
               else
               {
                    var incount = 0;
                    var outcount = 0;
                    for(var i = 0; i < result.length; i++)
                    {
    
                        for(var j = 0; j < result[i].detail.length; j++)
                        {
                            if(result[i].detail[j].pass_type == req.body.pass_type && result[i].detail[j].status == "in")
                            {
                                incount ++ ;
                            }
                            if(result[i].detail[j].pass_type == req.body.pass_type && result[i].detail[j].status == "out")
                            {
                                outcount ++ ;
                            }
                        }

                    }

                    switch(req.body.status)
                    {
                        case "in":
                            if(incount > 0 && ((incount - outcount) == 1))
                            {
                                return res.status(200).json({
                                    result: 1
                                });
                            }
                            else
                            {
                                return res.status(200).json({
                                    result: 0
                                });
                            }
                            break;
                        case "out":
                            if(outcount > 0 & outcount == incount)
                            {
                                return res.status(200).json({
                                    result: 1
                                });
                            }
                            else
                            {
                                return res.status(200).json({
                                    result: 0
                                });
                            }
                            break;
                    }
               }
            }
        );
    });

}


exports.getHistory = function(req, res)
{
   
    model_user.findOne({user_token: req.body.user_token }, function(err, result) {
		if (!result) {
            return res.status(200).json({
                result: -1     
            });
        }
      
        model_pass.aggregate(
            {
                $match: {
                    user_id: req.body.user_id
                }
            },
            
            function (err, result) {
                if(err)
                {
                    return res.status(200).json({
                        result: 0     
                    });
                }
                var res_psss = [];
                var res_purchase = [];
                var res_usage = [];
                for(var i = 0;  i < result.length; i++)
                {
                    var temp = {
                        type: result[i].pass_type,
                        from: result[i].from,
                        to: result[i].to,
                        quantity: result[i].remain_count
                    }
                    res_psss.push(temp);
                }

                model_purchase.aggregate(
                    {
                        $match: {
                            user_id: req.body.user_id
                        }
                    },
                    {
                        $sort: {
                            timestamp: -1
                        }
                    },
                    {
                        $limit: 10
                    },
                    function (err, result) {
                        if(err)
                        {
                            return res.status(200).json({
                                result: 0     
                            });
                        }
                        for(var i = 0;  i < result.length; i++)
                        {
                            var temp = {
                                timestamp: result[i].timestamp,
                                detail: []
                            }
                            for(var j = 0;  j < result[i].detail.length; j++)
                            {
                                temp.detail.push(result[i].detail[j].message);  
                            }
                            res_purchase.push(temp);
                        }
                        model_history.aggregate(
                            {
                                $match: {
                                    user_id: req.body.user_id
                                }
                            },
                            {
                                $sort: {
                                    timestamp: -1
                                }
                            },
                            {
                                $limit: 10
                            },
                            function (err, result) {
                                if(err)
                                {
                                    return res.status(200).json({
                                        result: 0     
                                    });
                                }
                                for(var i = 0;  i < result.length; i++)
                                {
                                    var temp = {
                                        timestamp: result[i].timestamp,
                                        detail: result[i].detail
                                    }
                                    res_usage.push(temp);
                                }

                                return res.status(200).json({
                                    result: 1,
                                    pass: res_psss,
                                    purchase: res_purchase,
                                    usage: res_usage     
                                });
                            }
                        );
                    }
                );
            }
        );
	});
}

exports.getEquipmentCount = function(req, res)
{
   
    model_user.findOne({user_token: req.body.user_token }, function(err, result) {
		if (!result) {
            return res.status(200).json({
                result: -1     
            });
        }
        model_equipment.find({type: req.body.type }, function(err, result) {
            if (!result) {
                return res.status(200).json({
                    result: 0     
                });
            }
            var myEquip ;
            for(var i = 0 ; i < result.length; i++)
            {
                myEquip = {
                    size: result[i].size,
                    quantity: result[i].quantity,
                    price: result[i].price,
                    price5: result[i].price5,
                    price10: result[i].price10,
                    onetime_fee: result[i].onetime_fee
                }
            }

            return res.status(200).json({
                result: 1,
                detail: myEquip    
            });
            
        });
        
	});
}


exports.deletedoc= function(req, res)
{
    switch(req.query.type)
    {
        case "admin":
            model_admin.remove().exec();
           
            break;
        case "user":
            model_user.remove().exec();
            break;
        case "qrcode":
            model_qrcode.remove().exec();
            break;
        case "purchase":
            model_purchase.remove().exec();
            break;
        case "pass":
            model_pass.remove().exec();
            break;
        case "history":
            model_history.remove().exec();
            break;
        case "feedback":
            model_feedback.remove().exec();
            break;
        case "equipment":
            model_equipment.remove().exec();
            break;
        case "all":
            model_admin.remove().exec();
            model_user.remove().exec();
            model_qrcode.remove().exec();
            model_purchase.remove().exec();
            model_pass.remove().exec();
            model_history.remove().exec();
            model_feedback.remove().exec();
            model_equipment.remove().exec();
            break;
    }

    return res.status(200).json({
        result: 1,
    });
}