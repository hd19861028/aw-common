var qs = require('querystring');
var fs = require('fs');
var q = Promise;
var common = require('./index');
var http = require('http');
var url = require('url');
exports = module.exports;

function getOptions(requrl, params) {
	var parsedUrl = url.parse(requrl, true);
	var options = {
		host: null,
		port: -1,
		path: null
	};
	options.host = parsedUrl.hostname;
	options.port = parsedUrl.port;
	options.path = parsedUrl.pathname;

	if (params) {
		options.method = 'post';
		options.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': params.length
		}
	} else {
		options.method = 'get';
	}
	if (parsedUrl.search) options.path += "?" + parsedUrl.search;

	return options;
}

/**
 * @param {String} requrl
 * @param {Object|String} data
 */
exports._post = function(requrl, data) {
	var d = q.defer();
	var params = '';
	if (data) {
		if (data.constructor.name == "String") {
			params = data;
		}
		if (data.constructor.name == "Object") {
			params = qs.stringify(data);
		}
	}

	var options = getOptions(requrl, params);

	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			d.resolve(chunk);
		});
		res.on('error', function(err) {
			d.reject(err);
		});
	});

	if (params) {
		req.write(params);
	}

	req.on('error', function(err) {
		d.reject(err);
	});
	req.end();
	return d.promise;
}

/**
 * @param {String} requrl
 */
exports._get = function(requrl) {
	var d = q.defer();
	var options = getOptions(requrl);

	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			d.resolve(chunk);
		});
		res.on('error', function(err) {
			d.reject(err);
		});
	});

	req.on('error', function(err) {
		d.reject(err);
	});
	req.end();
	return d.promise;
}

function _download(requrl, saveurl) {
	var d = q.defer();
	var options = getOptions(requrl);
	var req = http.request(options, function(res) {
		var writer = fs.createWriteStream(saveurl)
		res.pipe(writer)
		res.on('error', function() {
			d.resolve(false);
		})
		res.on('end', function() {
			d.resolve(true);
		});
	});
	req.on('error', function(err) {
		d.resolve(false);
	});
	req.end();
	return d.promise;
}
