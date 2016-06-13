var path = require('path');
var fs = require('fs');
var util = require('util');

/**
 * 时间戳转换成日期类型
 * 
 * @param {Object} format	日期格式，例如: yyyy-MM-dd HH:mm:ss.fff
 */
Number.prototype.Format = function(format) {
	var current = 0;
	if (this.toString().length <= 10) current = this * 1000;
	else current = this;
	var date = new Date(current);
	var formatstr = format;
	if (format != null && format != "") {
		if (formatstr.indexOf("yyyy") >= 0) {
			formatstr = formatstr.replace("yyyy", date.getFullYear());
		}
		if (formatstr.indexOf("MM") >= 0) {
			var month = date.getMonth() + 1;
			if (month < 10) {
				month = "0" + month;
			}
			formatstr = formatstr.replace("MM", month);
		}
		if (formatstr.indexOf("dd") >= 0) {
			var day = date.getDate();
			if (day < 10) {
				day = "0" + day;
			}
			formatstr = formatstr.replace("dd", day);
		}
		var hours = date.getHours();
		if (formatstr.indexOf("HH") >= 0) {
			if (month < 10) {
				month = "0" + month;
			}
			formatstr = formatstr.replace("HH", hours);
		}
		if (formatstr.indexOf("hh") >= 0) {
			if (hours > 12) {
				hours = hours - 12;
			}
			if (hours < 10) {
				hours = "0" + hours;
			}
			formatstr = formatstr.replace("hh", hours);
		}
		if (formatstr.indexOf("mm") >= 0) {
			var minute = date.getMinutes();
			if (minute < 10) {
				minute = "0" + minute;
			}
			formatstr = formatstr.replace("mm", minute);
		}
		if (formatstr.indexOf("ss") >= 0) {
			var second = date.getSeconds();
			if (second < 10) {
				second = "0" + second;
			}
			formatstr = formatstr.replace("ss", second);
		}
		if (formatstr.indexOf("fff") >= 0) {
			var microsecond = date.getMilliseconds();
			formatstr = formatstr.replace("fff", microsecond);
		}
	}
	return formatstr;
}

/**
 * node.js环境下，将字符串转换成二进制（中文转码）
 */
String.prototype.ConvertZhcn = function() {
	return new Buffer(this.valueOf()).toString('binary');
}

/**
 * 记录日志
 */
String.prototype.WriteLog = function(iserror) {
	write(iserror == true ? true : false, this.valueOf());
}

/**
 * 记录日志
 */
Error.prototype.WriteLog = function() {
	write(true, this.stack);
}

global.WriteLog = function(obj, iserror) {
	if (typeof obj == 'object') {
		obj = JSON.stringify(obj, null, 4)
	}
	if(typeof obj == 'string'){
		write(iserror == true ? true : false, obj)
	}
}

/**
 * 数组克隆
 */
Array.prototype.Clone = function() {
	var result = new Array();
	if (this) {
		for (var i = 0; i < this.length; i++) {
			result.push(this[i])
		}
	}
	return result;
}

function write(iserror, msg) {
	if (global.config) {
		var now = new Date().getTime();
		var date_str = now.Format('yyyy-MM-dd');
		var content = "";
		var filename = iserror ? "error-" : "info-";
		filename += date_str + ".log";
		var time_str = now.Format('yyyy-MM-dd HH:mm:ss.fff');
		content = time_str + '\n' + msg + '\n';
		if (iserror) {
			console.error(content)
		}
		if (process.platform == "win32" || global.config.debug == true) {
			var log = path.join(global.config.root, "log", filename);
			fs.appendFile(log, content, function(err) {});
			if (!iserror) {
				console.log(content)
			}
		}
	}
}