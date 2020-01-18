'use strict';

require('rootpath')();
var model_user = require('server/app/models/user.model');
var env_config = require('server/config/development');
var fs = require('fs');
var path = require('path');

var pdfMaker = require('pdfkit');

var md5 = require('md5');

exports.randDecimal = function()
{
	return Math.floor(Math.random()*(999998)+1);
}

exports.getFirstUpperString = function(str)
{
	return str.charAt(0).toUpperCase() + str.slice(1, str.length);
}

exports.getStringDate = function(aDate){
	var dd = new Date(aDate);
	var yy = dd.getFullYear();
	var mm = dd.getMonth() + 1;
	dd = dd.getDate();
	if (yy < 2000) { yy += 1900; }
	if (mm < 10) { mm = "0" + mm; }
	if (dd < 10) { dd = "0" + dd; }
	var rs = yy + "/" + mm + "/" + dd;
	return rs;
}

exports.dateFormat = function(timestamp)
{
	var result = ""
	var year, month, day, hour, minute, second;
	year = new Date(timestamp).getFullYear();
	month = ((new Date(timestamp).getMonth() + 1) < 10) ? ('0' + (new Date(timestamp).getMonth() + 1)) :(new Date(timestamp).getMonth() + 1);
	day = ((new Date(timestamp).getDate()) < 10) ? ('0' + (new Date(timestamp).getDate())) :(new Date(timestamp).getDate());
	hour = ((new Date(timestamp).getHours()) < 10) ? ('0' + (new Date(timestamp).getHours())) :(new Date(timestamp).getHours());
	minute = ((new Date(timestamp).getMinutes()) < 10) ? ('0' + (new Date(timestamp).getMinutes())) :(new Date(timestamp).getMinutes());
	second = ((new Date(timestamp).getSeconds()) < 10) ? ('0' + (new Date(timestamp).getSeconds())) :(new Date(timestamp).getSeconds());
	result = year + '/' + month + '/' + day + ' ' + hour + ":" + minute + ":" + second;
	return result;
}

exports.validate_fullyear = function()
{
	if(new Date(timestamp).getFullYear() % 4 == 0)
	{
		if(new Date(timestamp).getFullYear() % 100 == 0 && new Date(timestamp).getFullYear() % 400 != 0)
		{
			return 0;
		}
		else if(new Date(timestamp).getFullYear() % 400 == 0)
		{
			return 1;
		}
		return 1;
	}
	else
		return 0;
}

exports.getSeasonPrice = function(timestamp)
{
	var daycount = 30;

	switch(new Date().getMonth() + 1)
	{
		case 1:
			daycount = 31;
			break;
		case 2:
			daycount = 28;
			if(this.validate_fullyear())
				daycount = 29;
			break;
		case 3:
			daycount = 31;
			break;
		case 4:
			daycount = 30;
			break;
		case 5:
			daycount = 31;
			break;
		case 6:
			daycount = 30;
			break;
		case 7:
			daycount = 31;
			break;
		case 8:
			daycount = 31;
			break;
		case 9:
			daycount = 30;
			break;
		case 10:
			daycount = 31;
			break;
		case 11:
			daycount = 30;
			break;
		case 12:
			daycount = 31;
			break;

	}

	if(new Date(timestamp).getDate() ==  1)
		return 160;

	var return_price = parseInt(100 + 60 + 60 / daycount * (daycount - new Date(timestamp).getDate() + 1));

	return return_price;
}

exports.token_generator = function()
{
	var text = '';
	
	var charset="abcdefghijklmnopqrstuvwxyz0123456789";

	for( var i = 0; i < 30; i++)
		text += charset.charAt(Math.floor(Math.random() * charset.length));
	return text;
}

exports.sms_generator = function()
{
	var text = '';
	
	var charset="0123456789";

	for( var i = 0; i < 6; i++)
		text += charset.charAt(Math.floor(Math.random() * charset.length));
	return text;
}

exports.imageName_generator = function()
{
	var text = '';
	
	var charset="abcdefghijklmnopqrstuvwxyz0123456789";

	for( var i = 0; i < 20; i++)
		text += charset.charAt(Math.floor(Math.random() * charset.length));
	return text + '.png';
}

exports.pdf_generator = function()
{
	var text = '';
	
	var charset="abcdefghijklmnopqrstuvwxyz0123456789";

	for( var i = 0; i < 20; i++)
		text += charset.charAt(Math.floor(Math.random() * charset.length));
	return text + '.pdf';
}


exports.image_upload = function(image_urls, content, type, error, success)
{
	console.log("image uploading");
	var fileName, return_path, file_path;
	if(image_urls.length != 0)
	{
		for(var i = 0; i  < image_urls.length; i++)
		{
			if(image_urls[i].type == type)
			{
				if(image_urls[i].url != "")
				{
					fileName = image_urls[i].url.split('/')[2];
					return_path =  env_config.upload_image_dir + fileName;
					// file_path = 'server/assets/image/upload/' + fileName;
					file_path = path.join(__dirname + '../../../assets/image/upload/' + fileName);
				}
				else
				{
					fileName = this.imageName_generator();
					return_path =  env_config.upload_image_dir + fileName;
					// file_path = 'server/assets/image/upload/' + fileName;
					file_path = path.join(__dirname + '../../../assets/image/upload/' + fileName);
				}
			}
		}
	}
	else
	{
		fileName = this.imageName_generator();
		return_path =  env_config.upload_image_dir + fileName;
		file_path = path.join(__dirname + '../../../assets/image/upload/' + fileName);
	}	

	if(content.indexOf('http') >= 0)
	{
		
		var result = {
			type: type,
			path: env_config.upload_image_dir  + content.split('/')[content.split('/').length - 1]
		}
		
		success(result);
		
		console.log("image_" + type + " uploaded");
	}

	else

	{
		var base64Data = content.replace(/^data:image\/png;base64,/, "");
	
		fs.writeFile(file_path, base64Data, 'base64', function (err) {
	        if (err == null) {
				var result = {
					type: type,
					path: return_path
				}
				
			    success(result);
			   
			    console.log("image_" + type + " uploaded");
	        }
	        else {
	            error();
	        }
	    })
	}

	
}



exports.pdf_maker = function(user, sign_url, success)
{
	console.log("pdf making");

	var fileName, return_path, file_path;
	fileName = this.pdf_generator();
	return_path =  env_config.upload_pdf_dir + fileName;
	// file_path = 'server/assets/pdf/' + fileName;
	file_path = path.join(__dirname + '../../../assets/pdf/' + fileName);
	
	var str = user.activity_message;

	var doc = new pdfMaker(
		{
			size: [613, 864],
		}
	);
	doc.pipe(fs.createWriteStream(file_path));

	var x = doc.x, y = doc.y, w = 340;

	// doc.rect(x, y, w, h).stroke();
	var image_options = {
		width: 553,
		height: 804
	}


	doc.image(path.join(__dirname + '../../../assets/image/indemnity/indemnity.png'), 30, 30, image_options);

	doc.addPage();

	image_options = {
		width: w,
		height: 150
	}

	if(sign_url != undefined && sign_url != "" && sign_url != null)
		doc.image(path.join(__dirname + '../../../assets/image/upload/' + sign_url.split('/')[2]) , 136, 10, image_options);
	// doc.rect(x, y + doc.heightOfString(str, text_options) + 30, w, 150).stroke();
	
	doc.fontSize(20);
	doc.text('NAME:', 60, 180);
	doc.text(user.firstName + ' ' + user.familyName, 210, 180                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        );

	doc.text('DATE:', 60, 220);
	doc.text(user.signup_date, 210, 220);

	doc.end();

	console.log("pdf making finished");
	success(return_path);
}