sprintf = require('lib/sprintf').sprintf

// Object

global.merge = function (a, b) {
  if (!b) return a
  var keys = Object.keys(b)
  for (var i = 0, len = keys.length; i < len; ++i)
    a[keys[i]] = b[keys[i]]
  return a
}

global.mergeDeep = function(a, b) {
  if (!b) return a
  var target = a,
      keys = Object.keys(b)
  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i]
    if (typeof b[key] === 'object')
      target = Object.mergeDeep((target[key] = target[key] || {}), b[key])
    else
      target[key] = b[key]
  }
  return a
}

global.clone = function(o) {
    return global.merge({}, o)
}

global.cloneDeep = function(o) {
    return global.mergeDeep({}, o)
}
  
isArray = function(obj) {
     return toString.call(obj) === "[object Array]";
}

global.update = function(self, o) {
    for (k in o) if (o.hasOwnProperty(k)) self[k] = o[k]
    return self
}

// String
String.prototype.times = function(n) {
    return n > 0 ? (new Array(n+1)).join(this) : '';
}
String.prototype.format = function() {
    var args = Array.prototype.slice.call(arguments)
    args.unshift(this)
    for (var i=0, len=args.length; i<len; i++) {
        if (args[i] == null) args[i] = '<null>'
        else if (args[i] == undefined) args[i] = '<undefined>'
    }
    return sprintf.apply(null, args)
}
String.prototype.pad = function(len, pad) {
    return (pad || '0').times(len - this.length) + this;
}
String.prototype.trim = function () {
    return this.replace( /^\s+|\s+$/g, '' );
}

// Date

/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val)
			len = len || 2
			while (val.length < len) val = "0" + val
			return val
		}

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date
			date = undefined
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date()
		if (isNaN(date)) throw SyntaxError("invalid date")

		mask = String(dF.masks[mask] || mask || dF.masks["default"])

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4)
			utc = true
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1)
		})
	}
}()

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
}

// For convenience...
Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc)
}

// Date.prototype.toJSON = function() { return '@@'+this.toString() }
Date.prototype.toJSON = function () { return '@@'+this.getTime() }
Date.fromJSON = function(value) {
    if (typeof value === 'string' && value[0] == '@' && value[1] == '@')
        return new Date(parseInt(value.substr(2)))
    return null
}

Date.prototype.setUTC = function (year, month, day, hours, minutes, seconds, ms) {
    this.setUTCFullYear(year, month, day)
    this.setUTCHours(hours || 0, minutes || 0, seconds || 0, ms || 0)
    return this
}

global.TimeDelta = function (time) {
    this.time = time
    this.seconds = Math.floor(this.time / 1000) 
    this.minutes = Math.floor(this.seconds / 60) 
    this.hours   = Math.floor(this.minutes / 60) 
    this.days    = Math.floor(this.hours / 24) 
}   
global.TimeDelta.prototype.foo = 'bar'
    
// Array

global.sum = function(anArray) {
    if (anArray instanceof Array)
        return anArray.reduce(function(x,y) { return x+y }, 0)
    else
        return 0
}

global.compareInt = function(a, b) { return a - b }

global.minimum = function(list, valFunc) {
    var min = null
    for (var i=0, len=list.length; i<len; i++) {
        var val = valFunc ? valFunc(list[i]) : list[i]
        if (!min || min > val) min = val
    }
    return min
}

// JSON
global.dateReviver = function(key, value) {
    date = Date.fromJSON(value)
    return date ? date : value
}
