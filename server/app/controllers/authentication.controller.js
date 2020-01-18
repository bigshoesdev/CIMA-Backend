'use strict';

require('rootpath')();

var model_user = require('server/app/models/user.model');
var model_pass = require('server/app/models/pass.model');
var env_config = require('server/config/development');
var stripe = require('stripe')(env_config.stripe_apiKey);

var request = require('request');

var service = require('server/app/controllers/service.controller');

var md5 = require('md5');

var auth = this;

exports.set_user = function(body)
{
	return new model_user({
		user_phoneNumber: body.user_phoneNumber,
		user_email: (body.user_email == undefined) ? "" : body.user_email,
		user_address: body.user_address,
		user_token: service.token_generator(),
		firstName: body.firstName,
		familyName : body.familyName,
		birthDate: body.birthDate,
		nric_passNumber: body.nric_passNumber,
		gender : body.gender,
		guardian_name: body.guardian_name,
		guardian_phoneNumber : body.guardian_phoneNumber,
		guardian_relationship: body.guardian_relationship,
		emergency_name: body.emergency_name,
		emergency_phoneNumber : body.emergency_phoneNumber,
		emergency_relationship: body.emergency_relationship,
		picture_avatar: body.picture_avatar,
		picture_sign : body.picture_sign,
		activity_message : body.activity_message,
		signup_date: body.signup_date,
		promo: body.promo,
		qualification:  body.qualification,
		distanceoftime: 0,
		signup_stamp: body.timestamp
	});
}

exports.save_user = function(req, user, res)
{
	console.log("final user:", user);

	user.save(function(err, result) {
		if (err) {
			return res.status(500).send({ message: err.message });
		}
		auth.getAvailablePass(result.id, function(pass)
		{
			console.log("available pass:", pass);
			return res.status(200).json({
				result: 1,
				users: {
					user_id: user.id,
					user_phoneNumber: user.user_phoneNumber,
					user_email: user.user_email,
					user_address: user.user_address,
					user_token: user.user_token,
					firstName: user.firstName,
					familyName : user.familyName,
					birthDate: user.birthDate,
					nric_passNumber: user.nric_passNumber,
					gender : user.gender,
					guardian_name: user.guardian_name,
					guardian_phoneNumber : user.guardian_phoneNumber,
					guardian_relationship: user.guardian_relationship,
					emergency_name: user.emergency_name,
					emergency_phoneNumber : user.emergency_phoneNumber,
					emergency_relationship: user.emergency_relationship,
					picture_avatar: user.picture_avatar,
					picture_sign : user.picture_sign,
					pdf_url: user.pdf_url,
					activity_message : user.activity_message,
					signup_date:  user.signup_date,
					qualification:  user.qualification,
					signup_stamp: user.signup_stamp
				},
				pass: pass
			});
		});
		
	});
}

exports.update_user = function(email_flag, req, user_id, updateData, res)
{
	console.log("updating user");
	model_pass.findOne({user_id: user_id, pass_type: "promo" }, function(err, result) {
		if(err)
		{
			return res.status(200).json({
				result: 0     
			});
		}
		if(!result)
		{
			if(updateData.full == true)
			{
				var promo_pass = new model_pass({
					user_id: user_id,
					pass_type: "promo",
					from: "",
					to: "",
					remain_count: 1
				});
	
				promo_pass.save(function(err, result) {
					if (err) {
						return res.status(500).send({ message: err.message });
					}

					model_user.findByIdAndUpdate(user_id, {$set: updateData}, {new: true},  function(err, user){
						if (err) {
							return res.status(500).send({ message: err.message });
						}
						if(email_flag == true)
						{
							if(user.stripe_customerid != "")
							{
								stripe.customers.update(user.stripe_customerid, {
										email: user.user_email
									}, 
									function(err, customer)
									{
										if (err) {
											return res.status(200).json({
												result: 0
											});
										}
										auth.getAvailablePass(user_id, function(pass)
										{
											return res.status(200).json({
												result: 1,
												users: {
													user_id: user.id,
													user_phoneNumber: user.user_phoneNumber,
													user_email: user.user_email,
													user_address: user.user_address,
													user_token: user.user_token,
													firstName: user.firstName,
													familyName : user.familyName,
													birthDate: user.birthDate,
													nric_passNumber: user.nric_passNumber,
													gender : user.gender,
													guardian_name: user.guardian_name,
													guardian_phoneNumber : user.guardian_phoneNumber,
													guardian_relationship: user.guardian_relationship,
													emergency_name: user.emergency_name,
													emergency_phoneNumber : user.emergency_phoneNumber,
													emergency_relationship: user.emergency_relationship,
													picture_avatar: user.picture_avatar,
													picture_sign : user.picture_sign,
													pdf_url: user.pdf_url,
													activity_message : user.activity_message,
													signup_date:  user.signup_date,
													qualification:  user.qualification,
													signup_stamp: user.signup_stamp
												},
												pass: pass
											});
										});
									}
								);
							}
							else
							{
								auth.getAvailablePass(user_id, function(pass)
								{
									return res.status(200).json({
										result: 1,
										users: {
											user_id: user.id,
											user_phoneNumber: user.user_phoneNumber,
											user_email: user.user_email,
											user_address: user.user_address,
											user_token: user.user_token,
											firstName: user.firstName,
											familyName : user.familyName,
											birthDate: user.birthDate,
											nric_passNumber: user.nric_passNumber,
											gender : user.gender,
											guardian_name: user.guardian_name,
											guardian_phoneNumber : user.guardian_phoneNumber,
											guardian_relationship: user.guardian_relationship,
											emergency_name: user.emergency_name,
											emergency_phoneNumber : user.emergency_phoneNumber,
											emergency_relationship: user.emergency_relationship,
											picture_avatar: user.picture_avatar,
											picture_sign : user.picture_sign,
											pdf_url: user.pdf_url,
											activity_message : user.activity_message,
											signup_date:  user.signup_date,
											qualification:  user.qualification,
											signup_stamp: user.signup_stamp
										},
										pass: pass
									});
								});
							}
						}
						else
						{
							auth.getAvailablePass(user_id, function(pass)
							{
								return res.status(200).json({
									result: 1,
									users: {
										user_id: user.id,
										user_phoneNumber: user.user_phoneNumber,
										user_email: user.user_email,
										user_address: user.user_address,
										user_token: user.user_token,
										firstName: user.firstName,
										familyName : user.familyName,
										birthDate: user.birthDate,
										nric_passNumber: user.nric_passNumber,
										gender : user.gender,
										guardian_name: user.guardian_name,
										guardian_phoneNumber : user.guardian_phoneNumber,
										guardian_relationship: user.guardian_relationship,
										emergency_name: user.emergency_name,
										emergency_phoneNumber : user.emergency_phoneNumber,
										emergency_relationship: user.emergency_relationship,
										picture_avatar: user.picture_avatar,
										picture_sign : user.picture_sign,
										pdf_url: user.pdf_url,
										activity_message : user.activity_message,
										signup_date:  user.signup_date,
										qualification:  user.qualification,
										signup_stamp: user.signup_stamp
									},
									pass: pass
								});
							});
						}
					});
				});
			}
			else
			{
				model_user.findByIdAndUpdate(user_id, {$set: updateData}, {new: true},  function(err, user){
					if (err) {
						return res.status(500).send({ message: err.message });
					}
					if(email_flag == true)
					{
						if(user.stripe_customerid != "")
						{
							stripe.customers.update(user.stripe_customerid, {
									email: user.user_email
								}, 
								function(err, customer)
								{
									if (err) {
										return res.status(200).json({
											result: 0
										});
									}
									auth.getAvailablePass(user_id, function(pass)
									{
										return res.status(200).json({
											result: 1,
											users: {
												user_id: user.id,
												user_phoneNumber: user.user_phoneNumber,
												user_email: user.user_email,
												user_address: user.user_address,
												user_token: user.user_token,
												firstName: user.firstName,
												familyName : user.familyName,
												birthDate: user.birthDate,
												nric_passNumber: user.nric_passNumber,
												gender : user.gender,
												guardian_name: user.guardian_name,
												guardian_phoneNumber : user.guardian_phoneNumber,
												guardian_relationship: user.guardian_relationship,
												emergency_name: user.emergency_name,
												emergency_phoneNumber : user.emergency_phoneNumber,
												emergency_relationship: user.emergency_relationship,
												picture_avatar: user.picture_avatar,
												picture_sign : user.picture_sign,
												pdf_url: user.pdf_url,
												activity_message : user.activity_message,
												signup_date:  user.signup_date,
												qualification:  user.qualification,
												signup_stamp: user.signup_stamp
											},
											pass: pass
										});
									});
								}
							);
						}
						else
						{
							auth.getAvailablePass(user_id, function(pass)
							{
								return res.status(200).json({
									result: 1,
									users: {
										user_id: user.id,
										user_phoneNumber: user.user_phoneNumber,
										user_email: user.user_email,
										user_address: user.user_address,
										user_token: user.user_token,
										firstName: user.firstName,
										familyName : user.familyName,
										birthDate: user.birthDate,
										nric_passNumber: user.nric_passNumber,
										gender : user.gender,
										guardian_name: user.guardian_name,
										guardian_phoneNumber : user.guardian_phoneNumber,
										guardian_relationship: user.guardian_relationship,
										emergency_name: user.emergency_name,
										emergency_phoneNumber : user.emergency_phoneNumber,
										emergency_relationship: user.emergency_relationship,
										picture_avatar: user.picture_avatar,
										picture_sign : user.picture_sign,
										pdf_url: user.pdf_url,
										activity_message : user.activity_message,
										signup_date:  user.signup_date,
										qualification:  user.qualification,
										signup_stamp: user.signup_stamp
									},
									pass: pass
								});
							});
						}
					}
					else
					{
						auth.getAvailablePass(user_id, function(pass)
						{
							return res.status(200).json({
								result: 1,
								users: {
									user_id: user.id,
									user_phoneNumber: user.user_phoneNumber,
									user_email: user.user_email,
									user_address: user.user_address,
									user_token: user.user_token,
									firstName: user.firstName,
									familyName : user.familyName,
									birthDate: user.birthDate,
									nric_passNumber: user.nric_passNumber,
									gender : user.gender,
									guardian_name: user.guardian_name,
									guardian_phoneNumber : user.guardian_phoneNumber,
									guardian_relationship: user.guardian_relationship,
									emergency_name: user.emergency_name,
									emergency_phoneNumber : user.emergency_phoneNumber,
									emergency_relationship: user.emergency_relationship,
									picture_avatar: user.picture_avatar,
									picture_sign : user.picture_sign,
									pdf_url: user.pdf_url,
									activity_message : user.activity_message,
									signup_date:  user.signup_date,
									qualification:  user.qualification,
									signup_stamp: user.signup_stamp
								},
								pass: pass
							});
						});
					}
				});
			}
		}
		else
		{
			model_user.findByIdAndUpdate(user_id, {$set: updateData}, {new: true},  function(err, user){
				if (err) {
					return res.status(500).send({ message: err.message });
				}
				if(email_flag == true)
				{
					if(user.stripe_customerid != "")
					{
						stripe.customers.update(user.stripe_customerid, {
								email: user.user_email
							}, 
							function(err, customer)
							{
								if (err) {
									return res.status(200).json({
										result: 0
									});
								}
								auth.getAvailablePass(user_id, function(pass)
								{
									return res.status(200).json({
										result: 1,
										users: {
											user_id: user.id,
											user_phoneNumber: user.user_phoneNumber,
											user_email: user.user_email,
											user_address: user.user_address,
											user_token: user.user_token,
											firstName: user.firstName,
											familyName : user.familyName,
											birthDate: user.birthDate,
											nric_passNumber: user.nric_passNumber,
											gender : user.gender,
											guardian_name: user.guardian_name,
											guardian_phoneNumber : user.guardian_phoneNumber,
											guardian_relationship: user.guardian_relationship,
											emergency_name: user.emergency_name,
											emergency_phoneNumber : user.emergency_phoneNumber,
											emergency_relationship: user.emergency_relationship,
											picture_avatar: user.picture_avatar,
											picture_sign : user.picture_sign,
											pdf_url: user.pdf_url,
											activity_message : user.activity_message,
											signup_date:  user.signup_date,
											qualification:  user.qualification,
											signup_stamp: user.signup_stamp
										},
										pass: pass
									});
								});
							}
						);
					}
					else
					{
						auth.getAvailablePass(user_id, function(pass)
						{
							return res.status(200).json({
								result: 1,
								users: {
									user_id: user.id,
									user_phoneNumber: user.user_phoneNumber,
									user_email: user.user_email,
									user_address: user.user_address,
									user_token: user.user_token,
									firstName: user.firstName,
									familyName : user.familyName,
									birthDate: user.birthDate,
									nric_passNumber: user.nric_passNumber,
									gender : user.gender,
									guardian_name: user.guardian_name,
									guardian_phoneNumber : user.guardian_phoneNumber,
									guardian_relationship: user.guardian_relationship,
									emergency_name: user.emergency_name,
									emergency_phoneNumber : user.emergency_phoneNumber,
									emergency_relationship: user.emergency_relationship,
									picture_avatar: user.picture_avatar,
									picture_sign : user.picture_sign,
									pdf_url: user.pdf_url,
									activity_message : user.activity_message,
									signup_date:  user.signup_date,
									qualification:  user.qualification,
									signup_stamp: user.signup_stamp
								},
								pass: pass
							});
						});
					}
				}
				else
				{
					auth.getAvailablePass(user_id, function(pass)
					{
						return res.status(200).json({
							result: 1,
							users: {
								user_id: user.id,
								user_phoneNumber: user.user_phoneNumber,
								user_email: user.user_email,
								user_address: user.user_address,
								user_token: user.user_token,
								firstName: user.firstName,
								familyName : user.familyName,
								birthDate: user.birthDate,
								nric_passNumber: user.nric_passNumber,
								gender : user.gender,
								guardian_name: user.guardian_name,
								guardian_phoneNumber : user.guardian_phoneNumber,
								guardian_relationship: user.guardian_relationship,
								emergency_name: user.emergency_name,
								emergency_phoneNumber : user.emergency_phoneNumber,
								emergency_relationship: user.emergency_relationship,
								picture_avatar: user.picture_avatar,
								picture_sign : user.picture_sign,
								pdf_url: user.pdf_url,
								activity_message : user.activity_message,
								signup_date:  user.signup_date,
								qualification:  user.qualification,
								signup_stamp: user.signup_stamp
							},
							pass: pass
						});
					});
				}
			});                                                    
		}
		
	});
}

exports.main_func = function(req, result, res)
{
	console.log("success to main func!");

	var image_count, updateData;

	var user = auth.set_user(req.body);

	console.log("model_user show", user);
	
	var contents_image = 	[];

	if(user.picture_avatar != null && user.picture_avatar != '' && user.picture_avatar != undefined)
	{
		var temp = {
			content: user.picture_avatar,
			type: 'avatar',
			retrun_path: ''
		}
		contents_image.push(temp);

		updateData = 
		{
			user_phoneNumber: req.body.user_phoneNumber,
			user_token: service.token_generator(),
			user_address:  req.body.user_address,
			user_email:  req.body.user_email,
			gender: req.body.gender,
			qualification:  req.body.qualification,
			picture_avatar: req.body.picture_avatar,
			promo: req.body.promo,
			guardian_name : (req.body.guardian_name == null || req.body.guardian_name == undefined) ? "" : req.body.guardian_name,
			guardian_phoneNumber:  (req.body.guardian_phoneNumber == null || req.body.guardian_phoneNumber == undefined) ? "" : req.body.guardian_phoneNumber,
			guardian_relationship:  (req.body.guardian_relationship == null || req.body.guardian_relationship == undefined) ? "" : req.body.guardian_relationship,
			emergency_name :  (req.body.emergency_name == null || req.body.emergency_name == undefined) ? "" : req.body.emergency_name,
			emergency_phoneNumber:  (req.body.emergency_phoneNumber == null || req.body.emergency_phoneNumber == undefined) ? "" : req.body.emergency_phoneNumber,
			emergency_relationship: (req.body.emergency_relationship == null || req.body.emergency_relationship == undefined) ? "" : req.body.emergency_relationship,
			full: req.body.full
		}
	}

	else
	{
		updateData = 
		{
			user_phoneNumber: req.body.user_phoneNumber,
			user_token: service.token_generator(),
			user_address:  req.body.user_address,
			user_email:  req.body.user_email,
			gender: req.body.gender,
			qualification:  req.body.qualification,
			signup_date: req.body.signup_date,
			promo: req.body.promo,
			guardian_name : (req.body.guardian_name == null || req.body.guardian_name == undefined) ? "" : req.body.guardian_name,
			guardian_phoneNumber:  (req.body.guardian_phoneNumber == null || req.body.guardian_phoneNumber == undefined) ? "" : req.body.guardian_phoneNumber,
			guardian_relationship:  (req.body.guardian_relationship == null || req.body.guardian_relationship == undefined) ? "" : req.body.guardian_relationship,
			emergency_name :  (req.body.emergency_name == null || req.body.emergency_name == undefined) ? "" : req.body.emergency_name,
			emergency_phoneNumber:  (req.body.emergency_phoneNumber == null || req.body.emergency_phoneNumber == undefined) ? "" : req.body.emergency_phoneNumber,
			emergency_relationship: (req.body.emergency_relationship == null || req.body.emergency_relationship == undefined) ? "" : req.body.emergency_relationship,
			full: req.body.full
		}
	}

	if(user.picture_sign != null && user.picture_sign != '' && user.picture_sign != undefined)
	{
		var temp = {
			content: user.picture_sign,
			type: 'sign',
			retrun_path: ''
		}
		contents_image.push(temp);
	}

	console.log("contents_image:", contents_image);

	if (!result || result.nric_passNumber == "") {
		console.log("no user result. user creating.");

		var sign_url = "";
		image_count = 0;
		if(contents_image.length > 0)
		{
			for(var i = 0; i < contents_image.length; i++) {
				service.image_upload([], contents_image[i].content,  contents_image[i].type, function(err) {
					
					}, function(data) {
						image_count ++ ;
						for(var j = 0; j < contents_image.length; j++) {
							if(contents_image[j].type == data.type)
							{
								if(contents_image[j].type == "sign")
								{
									sign_url = data.path;
									user.picture_sign =  data.path;
								}
								if(contents_image[j].type == "avatar")
									user.picture_avatar =  data.path;	
								contents_image[j].retrun_path = data.path;
							}
						}

						if(image_count == contents_image.length)
							service.pdf_maker(req.body, sign_url, function(return_path)
								{

									user.distanceoftime = new Date().getTime() - req.body.timestamp;
									user.pdf_url = return_path;
									if(!result || result.nric_passNumber == "")
									{
										if(result && result.user_phoneNumber != "")
											model_user.find({ user_phoneNumber: result.user_phoneNumber }).remove().exec();
										auth.save_user(req, user, res);
									}
									else
										auth.save_user(req, user, res);
								}
							);
					}
				);
			}
		}

		else
		{

			service.pdf_maker(req.body, "", function(return_path)
				{
					user.distanceoftime = new Date().getTime() - req.body.timestamp;
					user.pdf_url = return_path;
					if(result.nric_passNumber == "")
					{
						model_user.find({ user_phoneNumber: result.user_phoneNumber }).remove().exec();
						auth.save_user(req, user, res);
					}
					else
						auth.save_user(req, user, res);
				}
			);
		}
		

	}

	else
	{
		console.log("user existing");
		var email_flag = false;
		if(result.user_email == updateData.user_email)
			email_flag = false;
		else if(result.user_email != updateData.user_email && updateData.user_email != "" && updateData.user_email != undefined)
			email_flag = true;
		image_count = 0;
		var image_urls = [];
		if(result.picture_sign != null && result.picture_sign != '' && result.picture_sign != undefined)
		{
			var temp = {
				type: "sign",
				url: result.picture_sign
			}
			image_urls.push(temp);
		}
		else
		{
			var temp = {
				type: "sign",
				url: ""
			}
			image_urls.push(temp);
		}

		if(result.picture_avatar != null && result.picture_avatar != '' && result.picture_avatar != undefined)
		{
			var temp = {
				type: "avatar",
				url: result.picture_sign
			}
			image_urls.push(temp);
		}
		else
		{
			var temp = {
				type: "avatar",
				url: ""
			}
			image_urls.push(temp);
		}

		if(contents_image.length > 0)
		{
			for(var i = 0; i < contents_image.length; i++) {
				service.image_upload(image_urls, contents_image[i].content,  contents_image[i].type, function(err) {
					
					}, function(data) {
						image_count ++ ;
						for(var j = 0; j < contents_image.length; j++) {
							if(contents_image[j].type == data.type)
							{
								if(contents_image[j].type == "sign")
								{
									updateData.picture_sign =  data.path;
								}
								if(contents_image[j].type == "avatar")
									updateData.picture_avatar =  data.path;	
								contents_image[j].retrun_path = data.path;
							}
						}

						if(image_count == contents_image.length)
							auth.update_user(email_flag, req, result.id, updateData, res);
							
					}
				);
			}
		}

		else
		{
			auth.update_user(email_flag, req, result.id, updateData, res);
		}
	}

	
}

exports.user_signup = function(req, res) {

	console.log("req body", req.body);
	if(req.body.user_id != undefined && req.body.user_id != null && req.body.user_id != '')
	{
		console.log("******");
		model_user.findOne({user_token: req.body.user_token }, function(err, result) {
			if (!result) {
				return res.status(200).json({
					result: -1     
				});
			}
			model_user.findOne({ _id: req.body.user_id }, function(err, result) {
				console.log("user_id exist");		
				auth.main_func(req, result, res);
			});
		});	
	}
	
	else
	{
		model_user.findOne({ user_phoneNumber: req.body.user_phoneNumber }, function(err, result) {
			console.log("phone number checked.");		
			auth.main_func(req, result, res);
		});
	}
	// service.pdf_maker(res);
}

exports.validate_pass = function(req, res)
{
	model_user.findOne({ user_token: req.body.user_token }, function(err, result) {
        if(err)
        {
            return res.status(200).json({
                result: -1
            });
		}
		var timestamp = new Date().getTime() - result.distanceoftime;
        model_pass.aggregate(
			{
				$match: {
					user_id: req.body.user_id,
					pass_type: req.body.pass_type
				}
			},
			function (err, result) {
				if(err)
				{
					return res.status(200).json({
						result: 0
					});
				}
				switch(req.body.pass_type)
				{
					case "promo":
						if(result[0].remain_count > 0)
						{
							var temp = {
								type: result[0].pass_type,
								from: result[0].from,
								to: result[0].to,
								quantity: result[0].remain_count,
								used: ((result[0].status == "in") ? true : false)
							}
							return res.status(200).json({
								result: 1,
								detail: temp
							});
						}
						var temp = {
							type: result[0].pass_type,
							from: result[0].from,
							to: result[0].to,
							quantity: result[0].remain_count,
							used: ((result[0].status == "in") ? true : false)
						}
						return res.status(200).json({
							result: 0,
							detail: temp
						});
						break;	
					case "season":
						if(timestamp >= result[0].from)
						{
							var temp = {
								type: result[0].pass_type,
								from: result[0].from,
								to: result[0].to,
								quantity: result[0].remain_count,
								used: ((result[0].status == "in") ? true : false)
							}
							return res.status(200).json({
								result: 1,
								detail: temp
							});
						}
						var temp = {
							type: result[0].pass_type,
							from: result[0].from,
							to: result[0].to,
							quantity: result[0].remain_count,
							used: ((result[0].status == "in") ? true : false)
						}
						return res.status(200).json({
							result: 0,
							detail: temp
						});
						break;
					case "multi":
						if(result[0].remain_count> 0 && timestamp >= result[0].from && timestamp <= result[0].to)
						{
							var temp = {
								type: result[0].pass_type,
								from: result[0].from,
								to: result[0].to,
								quantity: result[0].remain_count,
								used: ((result[0].status == "in") ? true : false)
							}
							return res.status(200).json({
								result: 1,
								detail: temp
							});
						}
						var temp = {
							type: result[0].pass_type,
							from: result[0].from,
							to: result[0].to,
							quantity: result[0].remain_count,
							used: ((result[0].status == "in") ? true : false)
						}
						return res.status(200).json({
							result: 0,
							detail: temp
						});
						break;
					case "day":
						if(result[0].remain_count != 0 && timestamp >= result[0].from && timestamp <= result[0].to)
						{
							if((result[0].remain_count - result[0].out_dayPass.length) == 0)
							{
								if(((Math.floor(result[0].out_dayPass[result[0].out_dayPass.length-1] / env_config.timeofday) - Math.floor(timestamp / env_config.timeofday)) == 0 ))
								{
									var temp = {
										type: result[0].pass_type,
										from: result[0].from,
										to: result[0].to,
										quantity: result[0].remain_count - result[0].out_dayPass.length + 1,
										used: ((result[0].status == "in") ? true : false)
									}
									return res.status(200).json({
										result: 1,
										detail: temp
									});
								}
								else
								{
									var temp = {
										type: result[0].pass_type,
										from: result[0].from,
										to: result[0].to,
										quantity: result[0].remain_count - result[0].out_dayPass.length + 1,
										used: ((result[0].status == "in") ? true : false)
									}
									return res.status(200).json({
										result: 0,
										detail: temp
									});
								}
							}
							else if((result[0].remain_count - result[0].out_dayPass.length) > 0)
							{
								var temp = {
									type: result[0].pass_type,
									from: result[0].from,
									to: result[0].to,
									quantity: result[0].remain_count - result[0].out_dayPass.length,
									used: ((result[0].status == "in") ? true : false)
								}
								return res.status(200).json({
									result: 1,
									detail: temp
								});
							}
							else
							{
								var temp = {
									type: result[0].pass_type,
									from: result[0].from,
									to: result[0].to,
									quantity: result[0].remain_count - result[0].out_dayPass.length,
									used: ((result[0].status == "in") ? true : false)
								}
								return res.status(200).json({
									result: 0,
									detail: temp
								});
							}
							
						}
						var temp = {
							type: result[0].pass_type,
							from: result[0].from,
							to: result[0].to,
							quantity: result[0].remain_count - result[0].out_dayPass.length + 1,
							used: ((result[0].status == "in") ? true : false)
						}
						return res.status(200).json({
							result: 0,
							detail: temp
						});
						break;
				}

			}
		);
    });
}

exports.getAvailablePass = function(user_id, callback)
{
	console.log("getAvailablePass starting");
	model_user.findOne({_id: user_id}, function(err, result) {
		if(err)
		{
			return;
		}
		if(!result)
		{
			return;
		}
		var userInfo = result;
		var timestamp = new Date().getTime() - result.distanceoftime;
		model_pass.find({user_id: user_id}, function(err, result) {
			if(err)
			{
				return res.status(500).send({ message: err.message });
			}
			var pass = [];
	
			for(var i = 0; i < result.length; i++)
			{
				switch(result[i].pass_type)
				{
					case "promo":
						// if(result[i].remain_count > 0 && timestamp < (userInfo.signup_stamp +  86400000 * 30))
						// {
						// 	var temp = {
						// 		type: result[i].pass_type,
						// 		from: result[i].from,
						// 		to: result[i].to,
						// 		quantity: result[i].remain_count,
						// 		used: ((result[i].status == "in") ? true : false),
						// 		message: "COMPLEMENTARY PASS",
						// 		expire: "",
						// 		terminate: result[i].terminate,
						// 		freeze_to: result[i].freeze_to,
						// 		freeze_from: result[i].freeze_from,
						// 		status: ""
						// 	}
						// 	pass.push(temp);
						// }

						if(result[i].remain_count != 0 && timestamp < new Date('2018/05/01').getTime())
						{
							if((result[i].remain_count - result[i].out_dayPass.length) == 0)
							{
								if(((Math.floor(result[i].out_dayPass[result[i].out_dayPass.length-1] / env_config.timeofday) - Math.floor(timestamp / env_config.timeofday)) == 0 ))
								{
									var temp = {
										type: result[i].pass_type,
										from: result[i].from,
										to: result[i].to,
										quantity: result[i].remain_count - result[i].out_dayPass.length + 1,
										used: ((result[i].status == "in") ? true : false),
										message: "COMPLEMENTARY PASS",
										expire: new Date(result[i].to).toDateString(),
										terminate: result[i].terminate,
										freeze_to: result[i].freeze_to,
										freeze_from: result[i].freeze_from,
										status: ""
									}
									pass.push(temp);
								}
							}
							else
							{
								var temp = {
									type: result[i].pass_type,
									from: result[i].from,
									to: result[i].to,
									quantity: result[i].remain_count,
									used: ((result[i].status == "in") ? true : false),
									message: "COMPLEMENTARY PASS",
									expire: new Date(result[i].to).toDateString(),
									terminate: result[i].terminate,
									freeze_to: result[i].freeze_to,
									freeze_from: result[i].freeze_from,
									status: ""
								}
								pass.push(temp);
							} 
							
						}
						break;	
					case "season":
						// if(timestamp >= result[i].from)
						// {
							if(result[i].season_status == "freeze" && timestamp >= new Date(result[i].freeze_from).getTime() && timestamp <= new Date(result[i].freeze_to).getTime())
							{
								console.log("season ignored");
							}
							
							else
							{
								var temp = {
									type: result[i].pass_type,
									from: result[i].from,
									to: result[i].to,
									quantity: result[i].remain_count,
									used: ((result[i].status == "in") ? true : false),
									message: "SEASON PASS",
									expire: "",
									terminate: result[i].terminate,
									freeze_to: result[i].freeze_to,
									freeze_from: result[i].freeze_from,
									season_status: result[i].season_status,
									status: ""
								}
								pass.push(temp);
							}
						// }
						break;
					case "multi":
						// if(result[i].remain_count> 0 && timestamp >= result[i].from && timestamp <= result[i].to)
						// {
						// 	var temp = {
						// 		type: result[i].pass_type,
						// 		from: result[i].from,
						// 		to: result[i].to,
						// 		quantity: result[i].remain_count,
						// 		used: ((result[i].status == "in") ? true : false),
						// 		message: "MULTI PASS",
						// 		expire: new Date(result[i].to).toDateString(),
						// 		terminate: result[i].terminate,
						// 		freeze_to: result[i].freeze_to,
						// 		freeze_from: result[i].freeze_from,
						// 		status: ""
						// 	}
						// 	pass.push(temp);
						// }

						if(result[i].remain_count >= 0 && timestamp >= result[i].from && timestamp <= result[i].to)
						{

							var temp = {
								type: result[i].pass_type,
								from: result[i].from,
								to: result[i].to,
								quantity: result[i].remain_count,
								used: ((result[i].status == "in") ? true : false),
								message: "MULTI PASS",
								expire: new Date(result[i].to).toDateString(),
								terminate: result[i].terminate,
								freeze_to: result[i].freeze_to,
								freeze_from: result[i].freeze_from,
								status: ""
							}
							pass.push(temp);
							// if((result[i].remain_count - result[i].out_dayPass.length) == 0)
							// {
							// 	if(((Math.floor(result[i].out_dayPass[result[i].out_dayPass.length-1] / env_config.timeofday) - Math.floor(timestamp / env_config.timeofday)) == 0 ))
							// 	{
							// 		var temp = {
							// 			type: result[i].pass_type,
							// 			from: result[i].from,
							// 			to: result[i].to,
							// 			quantity: result[i].remain_count - result[i].out_dayPass.length + 1,
							// 			used: ((result[i].status == "in") ? true : false),
							// 			message: "MULTI PASS",
							// 			expire: new Date(result[i].to).toDateString(),
							// 			terminate: result[i].terminate,
							// 			freeze_to: result[i].freeze_to,
							// 			freeze_from: result[i].freeze_from,
							// 			status: ""
							// 		}
							// 		pass.push(temp);
							// 	}
							// }
							// else
							// {
							// 	var temp = {
							// 		type: result[i].pass_type,
							// 		from: result[i].from,
							// 		to: result[i].to,
							// 		quantity: result[i].remain_count,
							// 		used: ((result[i].status == "in") ? true : false),
							// 		message: "MULTI PASS",
							// 		expire: new Date(result[i].to).toDateString(),
							// 		terminate: result[i].terminate,
							// 		freeze_to: result[i].freeze_to,
							// 		freeze_from: result[i].freeze_from,
							// 		status: ""
							// 	}
							// 	pass.push(temp);
							// } 
							
						}
						break;
					case "day":
						if(result[i].remain_count >= 0 && timestamp >= result[i].from && timestamp <= result[i].to)
						{

							var temp = {
								type: result[i].pass_type,
								from: result[i].from,
								to: result[i].to,
								quantity: result[i].remain_count,
								used: ((result[i].status == "in") ? true : false),
								message: "Day PASS",
								expire: new Date(result[i].to).toDateString(),
								terminate: result[i].terminate,
								freeze_to: result[i].freeze_to,
								freeze_from: result[i].freeze_from,
								status: ""
							}
							pass.push(temp);
							// if((result[i].remain_count - result[i].out_dayPass.length) == 0)
							// {
							// 	if(((Math.floor(result[i].out_dayPass[result[i].out_dayPass.length-1] / env_config.timeofday) - Math.floor(timestamp / env_config.timeofday)) == 0 ))
							// 	{
							// 		var temp = {
							// 			type: result[i].pass_type,
							// 			from: result[i].from,
							// 			to: result[i].to,
							// 			quantity: result[i].remain_count - result[i].out_dayPass.length + 1,
							// 			used: ((result[i].status == "in") ? true : false),
							// 			message: "DAY PASS",
							// 			expire: new Date(result[i].to).toDateString(),
							// 			terminate: result[i].terminate,
							// 			freeze_to: result[i].freeze_to,
							// 			freeze_from: result[i].freeze_from,
							// 			status: ""
							// 		}
							// 		pass.push(temp);
							// 	}
							// }
							// else
							// {
							// 	var temp = {
							// 		type: result[i].pass_type,
							// 		from: result[i].from,
							// 		to: result[i].to,
							// 		quantity: result[i].remain_count,
							// 		used: ((result[i].status == "in") ? true : false),
							// 		message: "Day PASS",
							// 		expire: new Date(result[i].to).toDateString(),
							// 		terminate: result[i].terminate,
							// 		freeze_to: result[i].freeze_to,
							// 		freeze_from: result[i].freeze_from,
							// 		status: ""
							// 	}
							// 	pass.push(temp);
							// } 
							
						}
						break;
				}
			}
			callback(pass);
		});
	});

}

exports.getAvailablePass_web = function(user_id, callback)
{
	model_user.findOne({_id: user_id}, function(err, result) {
		if(err)
		{
			return;
		}
		if(!result)
		{
			return;
		}
		var userInfo = result;
		var timestamp = new Date().getTime() - result.distanceoftime;
		model_pass.find({user_id: user_id}, function(err, result) {
			if(err)
			{
				return res.status(500).send({ message: err.message });
			}
			var pass = [];
	
			for(var i = 0; i < result.length; i++)
			{
				switch(result[i].pass_type)
				{
					case "promo":
						
						if(result[i].remain_count != 0 && timestamp < new Date('2018/05/01').getTime())
						{
							if((result[i].remain_count - result[i].out_dayPass.length) == 0)
							{
								if(((Math.floor(result[i].out_dayPass[result[i].out_dayPass.length-1] / env_config.timeofday) - Math.floor(timestamp / env_config.timeofday)) == 0 ))
								{
									var temp = {
										type: result[i].pass_type,
										from: result[i].from,
										to: result[i].to,
										quantity: result[i].remain_count - result[i].out_dayPass.length + 1,
										used: ((result[i].status == "in") ? true : false),
										message: "COMPLEMENTARY PASS",
										expire: new Date(result[i].to).toDateString(),
										terminate: result[i].terminate,
										freeze_to: result[i].freeze_to,
										freeze_from: result[i].freeze_from,
										status: ""
									}
									pass.push(temp);
								}
							}
							else
							{
								var temp = {
									type: result[i].pass_type,
									from: result[i].from,
									to: result[i].to,
									quantity: result[i].remain_count,
									used: ((result[i].status == "in") ? true : false),
									message: "COMPLEMENTARY PASS",
									expire: new Date(result[i].to).toDateString(),
									terminate: result[i].terminate,
									freeze_to: result[i].freeze_to,
									freeze_from: result[i].freeze_from,
									status: ""
								}
								pass.push(temp);
							} 
							
						}
						break;	
					case "season":

							var temp = {
								type: result[i].pass_type,
								from: result[i].from,
								to: result[i].to,
								quantity: result[i].remain_count,
								used: ((result[i].status == "in") ? true : false),
								message: "SEASON PASS",
								expire: "",
								terminate: result[i].terminate,
								freeze_to: result[i].freeze_to,
								freeze_from: result[i].freeze_from,
								season_status: result[i].season_status,
								status: ""
							}
							pass.push(temp);
							
						// }
						break;
					case "multi":

						if(result[i].remain_count >= 0)
						{

							var temp = {
								type: result[i].pass_type,
								from: result[i].from,
								to: result[i].to,
								quantity: result[i].remain_count,
								used: ((result[i].status == "in") ? true : false),
								message: "MULTI PASS",
								expire: new Date(result[i].to).toDateString(),
								terminate: result[i].terminate,
								freeze_to: result[i].freeze_to,
								freeze_from: result[i].freeze_from,
								status: ""
							}
							pass.push(temp);
							
						}
						break;
					case "day":
						if(result[i].remain_count >= 0)
						{

							var temp = {
								type: result[i].pass_type,
								from: result[i].from,
								to: result[i].to,
								quantity: result[i].remain_count,
								used: ((result[i].status == "in") ? true : false),
								message: "Day PASS",
								expire: new Date(result[i].to).toDateString(),
								terminate: result[i].terminate,
								freeze_to: result[i].freeze_to,
								freeze_from: result[i].freeze_from,
								status: ""
							}
							pass.push(temp);
							
						}
						break;
				}
			}
			callback(pass);
		});
	});

}

exports.send_sms = function(req, res){

	if(req.body.user_phoneNumber.indexOf("1") == 1)
	{
		var sms_str = service.sms_generator();
		model_user.findOne({ user_phoneNumber: req.body.user_phoneNumber }, function(err, user) {
			if(!user)
			{

				console.log("message_url: " + 'https://rest.nexmo.com/sc/us/2fa/json?api_key=90f975d0&api_secret=c7e7912c225049ee&to=' + req.body.user_phoneNumber.replace('+', '') + '&pin=' + sms_str);
				var options = {
					uri: 'https://rest.nexmo.com/sc/us/2fa/json?api_key=90f975d0&api_secret=c7e7912c225049ee&to=' + req.body.user_phoneNumber.replace("+", "") + '&pin=' + sms_str,
					method: 'GET'
				};

				console.log("sms sent:", sms_str);
				request(options, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log("sms sented successfully");
						console.log(body);
						var user = new model_user({
							user_phoneNumber: req.body.user_phoneNumber,
							user_token: service.token_generator(),
							sms: sms_str
						});
			
						user.save(function(err, result) {
							if (err) {
								return res.status(500).send({ message: err.message });
							}
							return res.status(200).json({
								result: 1
							});
						});
					}
					else
					{
						console.log("sms sented failed");
						return res.status(200).json({
							result: 0
						});
					}
				});

			}
			else
			{
				console.log("message_url: " + 'https://rest.nexmo.com/sc/us/2fa/json?api_key=90f975d0&api_secret=c7e7912c225049ee&to=' + req.body.user_phoneNumber.replace('+', '') + '&pin=' + sms_str);

				var options = {
					uri: 'https://rest.nexmo.com/sc/us/2fa/json?api_key=90f975d0&api_secret=c7e7912c225049ee&to=' + req.body.user_phoneNumber.replace("+", "") + '&pin=' + sms_str,
					method: 'GET'
				};
				console.log("sms sent:", sms_str);
				request(options, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log("sms sented successfully");
						console.log(body);
						user.sms = sms_str;
						model_user.findOneAndUpdate({user_phoneNumber: req.body.user_phoneNumber }, {$set: user}, {new: true},  function(err, user){
							if (err) {
								return res.status(500).send({ message: err.message });
							}
							return res.status(200).json({
								result: 1
							});
						});
					}
					else
					{
						console.log("sms sented failed");
						return res.status(200).json({
							result: 0
						});
					}
				});
				
				
			}	
		});		
	}
	else
	{
		var sms_str = service.sms_generator();
		model_user.findOne({ user_phoneNumber: req.body.user_phoneNumber }, function(err, user) {
			if(!user)
			{
				var options = {
					uri: 'https://rest.nexmo.com/sms/json',
					method: 'POST',
					json: {
						"api_key": env_config.nexmo_api_key,
						"api_secret": env_config.nexmo_api_secret,
						"to": req.body.user_phoneNumber,
						"from": "NEXMO",
						"text": "Welcome to Boulder World!   " + sms_str
					}
				};

				// var user = new model_user({
				// 	user_phoneNumber: req.body.user_phoneNumber,
				// 	user_token: service.token_generator(),
				// 	sms: sms_str
				// });

				// user.save(function(err, result) {
				// 	if (err) {
				// 		return res.status(500).send({ message: err.message });
				// 	}
				// 	return res.status(200).json({
				// 		result: 1
				// 	});
				// });
				console.log("sms sent:", sms_str);
				request(options, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log("sms sented successfully");
						var user = new model_user({
							user_phoneNumber: req.body.user_phoneNumber,
							user_token: service.token_generator(),
							sms: sms_str
						});
			
						user.save(function(err, result) {
							if (err) {
								return res.status(500).send({ message: err.message });
							}
							return res.status(200).json({
								result: 1
							});
						});
					}
					else
					{
						console.log("sms sented failed");
						return res.status(200).json({
							result: 0
						});
					}
				});

			}
			else
			{

				// user.sms = sms_str;
				// model_user.findOneAndUpdate({user_phoneNumber: req.body.user_phoneNumber }, {$set: user}, {new: true},  function(err, user){
				// 	if (err) {
				// 		return res.status(500).send({ message: err.message });
				// 	}
				// 	return res.status(200).json({
				// 		result: 1
				// 	});
				// });
				var options = {
					uri: 'https://rest.nexmo.com/sms/json',
					method: 'POST',
					json: {
						"api_key": env_config.nexmo_api_key,
						"api_secret": env_config.nexmo_api_secret,
						"to": req.body.user_phoneNumber,
						"from": "NEXMO",
						"text": sms_str
					}
				};
				console.log("sms sent:", sms_str);
				request(options, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						console.log("sms sented successfully");
						user.sms = sms_str;
						model_user.findOneAndUpdate({user_phoneNumber: req.body.user_phoneNumber }, {$set: user}, {new: true},  function(err, user){
							if (err) {
								return res.status(500).send({ message: err.message });
							}
							return res.status(200).json({
								result: 1
							});
						});
					}
					else
					{
						console.log("sms sented failed");
						return res.status(200).json({
							result: 0
						});
					}
				});
				
				
			}	
		});		
	}


	
}

exports.validate_sms = function(req, res){

	model_user.findOne({ user_phoneNumber: req.body.user_phoneNumber, sms: req.body.sms }, function(err, user) {
		if(!user)
		{
			return res.status(200).json({
				result: 0
			});
		}
		else
		{
			return res.status(200).json({
				result: 1
			});
		}	
	});		
}

exports.user_login = function(req, res) {
	
	model_user.findOne({ user_phoneNumber: req.body.user_phoneNumber }, function(err, user) {		
		if(!user)
		{
			return res.status(200).json({
				result: 0
			});
		}	
		else
		{
			if(user.nric_passNumber == "")
			{
				return res.status(200).json({
					result: 0
				});
			}

			else
			{
				var updateData = {
					user_token: service.token_generator(),
				};
				model_user.findOneAndUpdate({user_phoneNumber: req.body.user_phoneNumber }, {$set: updateData}, {new: true},  function(err, user){
					if (err) {
						return res.status(500).send({ message: err.message });
					}
					auth.getAvailablePass(user.id, function(pass)
					{
						return res.status(200).json({
							result: 1,
							users: {
								user_id: user.id,
								user_phoneNumber: user.user_phoneNumber,
								user_email: user.user_email,
								user_address: user.user_address,
								user_token: user.user_token,
								firstName: user.firstName,
								familyName : user.familyName,
								birthDate: user.birthDate,
								nric_passNumber: user.nric_passNumber,
								gender : user.gender,
								guardian_name: user.guardian_name,
								guardian_phoneNumber : user.guardian_phoneNumber,
								guardian_relationship: user.guardian_relationship,
								emergency_name: user.emergency_name,
								emergency_phoneNumber : user.emergency_phoneNumber,
								emergency_relationship: user.emergency_relationship,
								picture_avatar: user.picture_avatar,
								picture_sign : user.picture_sign,
								pdf_url: user.pdf_url,
								activity_message : user.activity_message,
								signup_date:  user.signup_date,
								qualification:  user.qualification,
								signup_stamp: user.signup_stamp
							},
							pass: pass
						});
					});
				
				});
			}

		}
	});

	
}

exports.userInfo = function(req, res)
{
	model_user.findOne({user_token: req.body.user_token }, function(err, result) {
        if (!result) {
            return res.status(200).json({
                result: -1     
            });
		}
		
		model_user.findOne({ _id: req.body.user_id }, function(err, user) {		
			if(!user)
			{
				return res.status(200).json({
					result: 0
				});
			}	
			else
			{

				auth.getAvailablePass(req.body.user_id, function(pass)
				{
					return res.status(200).json({
						result: 1,
						users: {
							user_id: user.id,
							user_phoneNumber: user.user_phoneNumber,
							user_email: user.user_email,
							user_address: user.user_address,
							user_token: user.user_token,
							firstName: user.firstName,
							familyName : user.familyName,
							birthDate: user.birthDate,
							nric_passNumber: user.nric_passNumber,
							gender : user.gender,
							guardian_name: user.guardian_name,
							guardian_phoneNumber : user.guardian_phoneNumber,
							guardian_relationship: user.guardian_relationship,
							emergency_name: user.emergency_name,
							emergency_phoneNumber : user.emergency_phoneNumber,
							emergency_relationship: user.emergency_relationship,
							picture_avatar: user.picture_avatar,
							picture_sign : user.picture_sign,
							pdf_url: user.pdf_url,
							activity_message : user.activity_message,
							signup_date:  user.signup_date,
							qualification:  user.qualification,
							signup_stamp: user.signup_stamp
						},
						pass: pass
					});
				});
			}
		});
    
    });
}