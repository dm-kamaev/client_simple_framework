// 'use strict';
var HASH_KEY_FOR_REQUEST = {};
var GLOB  = {}; // глобальный hash
var D     = document, W = window;
var d     = D.documentElement;
var H     = D.getElementsByTagName('head')[0];
var log   = console.log.bind(console);
var error = console.error.bind(console);
var trace = console.trace.bind(console);
var err_trace = function (text) { error(new Error(text)); };
var encode = encodeURIComponent, decode = decodeURIComponent;
var emptyFunction = function () {};

var LIMIT_WINDOW_ERROR = 0; // limit посылания клиенских ошибок
W.onerror = function(m,u,l,c,e) { // message, source, lineno, colno, error_obj
  if (LIMIT_WINDOW_ERROR >= 3) {
    return;
  }
  LIMIT_WINDOW_ERROR++;
  var cookies = getCookies();
  if (!Object.keys(cookies).length) {
    return;
  }
  _ajx.post('/aj/?action=log_client_err_to_server', {
    m: m,
    u: u,
    l: l,
    c: c,
    e: (e || {}).stack,
    cookies: cookies,
  });
};

// руками сформированные ошибки
// sendError('D.createEvent("MouseEvents") => '+err);
// sendError('D.createEvent("MouseEvents")');
function sendError() {
  var m, err;
  if (arguments.length === 2) {
    var text = arguments[0];
    err = arguments[1];
    m = text+' '+err;
  } else {
    err = new Error(arguments[0]);
    m = err.toString();
  }
  error(m);
  var cookies = getCookies();
  if (!Object.keys(cookies).length) {
    return;
  }
  _ajx.post('/aj/?action=log_client_err_to_server', {
    m: m,
    u: W.location.href, // current url
    e: (err || {}).stack,
    cookies: cookies,
  });
}


var oop = {
  define_class: function() {
    var argv = arguments,
        without_option = argv.length === 1,
        $new = null, fun, option = {};
    if (without_option) {
      fun = argv[0];
    } else {
      option = argv[0];
      fun = argv[1];
    }
    $new = function() {
      var instance = {
        $created: { name: option.name || '' }
      };
      fun(instance);
      var result_new = instance.new.apply(instance, arguments);
      instance.new = null;
      if (option.name) {
        instance.$created.name = option.name;
      }
      return (result_new) ? result_new : instance;
    };
    return {
      new: $new,
    };
  }
};


var MODULES = {
  set: function(key, value) { if (MODULES[key]) { err_trace('Duplicate key => "'+key+'"'); return MODULES[key]; } MODULES[key] = value; return value; },
  get: function(key) { var module = MODULES[key]; return module || err_trace('Not found module by key => "'+key+'"'); }
};

/* DOM */
function getByID(id) {
  var el=document.getElementById(id);
  return (el) ? el : (err_trace('getByID not get element by id => "#'+id+'"'));
}

function $D (el) {
  el.show = function (display) { return showEl(el, display); };
  el.hide = function ()        { return hideEl(el); };
  return el;
}

// function getByClass(class_name)    { var el=document.getElementsByClassName(class_name); return (el[0]) ? el[0] : (err_trace('getByClass not get element by class => ".'+class_name+'"')); }
function getByClassAll(class_name) { var els=document.getElementsByClassName(class_name); if(els&&els.length!==0) { return els; } else { err_trace('getByClassAll not get elements by class => ".'+class_name+'"');return []; } }
// удаляем в родительском узле дочерний узел и возвращаем его
function removeElement (parent, child) {
  parent = (typeof parent === 'string') ? getByID(parent) : parent;
  child  = (typeof child === 'string')  ? getByID(child)  : child;
  if (!parent) { err_trace('removeElement not get element by parent_id => "'+parent+'"'); }
  if (!child)  { err_trace('removeElement not get element by child_id  => "'+child+'"'); }
  return parent.removeChild(child);
}


// получить data-attribute элемента
function getDataAttribute (el) {
  if (!el) { err_trace('getDataAttribute not get element => '+el); return {}; }
  el = (typeof el === 'string') ? getByID(el) : el;
  return el.dataset || {};
}


// очищаем input
function cleanInput (el) {
  if (!el) { err_trace('cleanInput not get element => '+el); return {}; }
  el = (typeof el === 'string') ? getByID(el) : el;
  el.value = '';
}


/*function clenEl (el) {
  if (!el) { err_trace('clenEl not get element => '+el); return; }
    el = (typeof el === 'string') ? getByID(el) : el;
    el.innerHTML = '';
}*/


function showEl (el, display) {
  if (!el) { err_trace('showEl not get element => '+el); return; }
  if (!display) { err_trace('showEl not get display => '+display); return; }
  el = (typeof el === 'string') ? getByID(el) : el;
  el.style.display = display;
  return el;
}


function hideEl (el) {
  if (!el) { err_trace('hideEl not get element => '+el); return; }
  el = (typeof el === 'string') ? getByID(el) : el;
  el.style.display = 'none';
  return el;
}


/*function onClick (el, cb) {
  if (!el) { err_trace('onClick not get element => '+el); return; }
    el = (typeof el === 'string') ? getByID(el) : el;
    el.onclick = cb;
}*/

/* END DOM*/

/* EFFECTS */
// ПАТТЕРН ИСПОЛЬЗОВАНИЯ
// fadeCh(document.getElementById('hello'),'Out','none', 100, function() {
//   fadeCh(document.getElementById('hello'),'In','inline', 100);
// });
// fadeCh(document.getElementById('hello'),'In','inline', 100);
// fadeCh(document.getElementById('hello'),'Out','none', 100);
/**
 * fadeInOut функция проявления и затухания
 * @param  {[object]}   el          id элемента
 * @param  {[string]}   way         In or Out
 * @param  {[string]}   displayType тип свойства display
 * @param  {[digit]}    time        время эффекта
 */
/*function fadeCh (el, way, displayType, time, cb){
  el = (el === 'string') ? getByID(el) : el;
  var info = {};
  info.op = +el.style.opacity; // привели к числу
  var s = (way === 'In') ? (1 / time) : -1 * (1 / time);
  if (way === 'In') { el.style.display = displayType; } // меняем свойство с none на переданное

  (function fade() {
     el.style.opacity = info.op + s;
     info.op = info.op + s;
    // End fadeIn
    if (info.op >= 1 && way === 'In') {
      if (cb) { cb(); }
    }
    // End fadeOut
    else if (info.op <= 0 && way === 'Out') {
      el.style.display = displayType; // как правило это none
      el.style.opacity = '0';
      if (cb) { cb(); }
    }
    else {
      ( window.requestAnimationFrame && requestAnimationFrame(fade) ) || setTimeout(fade, 16);
    }
  })();
}*/


/**
 *  Пример вызова drawBorders(0);
 * [drawBorders –– Функция рисует бордеры рандомного цвета вокруг элементов]
 * \@param  {[type–– digit]} trigger [Если trigger === 1, то рисуем бордеры]
 */
function drawBorders (trigger) {
  if (trigger === 1) {
    [].forEach.call(document.querySelectorAll("*"), function(a) {
      a.style.outline = "2px solid #" + (~~(Math.random() * (1 << 24))).toString(16);
    });
  }
}
/* END EFFECTS */

// коориднаты элемента отсительно viewport
// для получения коориднат относительно body надо
// добавить pageYOffset, pageXOffset
function getObjLocation(id) {
  var el = getByID(id), r = {};
  if (el) {r = el.getBoundingClientRect();
    return { left:r.left, top:r.top, right:r.right, bottom:r.bottom };
  }
}

// TODO: Поменять на \u0001 (&), \u0002 (=), \u0003 (что-то еще)
// build hash from string: key=value&key=value
// = –– \u003d, & –– \u0026 (add \ before чтобы не интерполировать)
function getHash (str) {
  if (!str || /^\s+$/.test(str)) {return {};}
  var keysValues = str.split('u0026'),
      res = {};
  for (var i = 0, l = keysValues.length; i < l; i++) {
     var key_val = keysValues[i].split('u003d');
     res[key_val[0]] = key_val[1];
  }
  return res;
}

/* SUPPORT METHODS */
// console.log(isEmptyHash({1:2}));
// console.log(isEmptyHash([1]));
function isEmptyHash (hash) {
  if (typeof hash === 'object' && !hash.length && hash.length !== 0) {
    for (var i in hash) {
      if (hash.hasOwnProperty(i)) { return false; }
    }
    return true;
  } else { console.log('ERROR: isEmptyHash | hash: '+hash+' is not hash'); }
}


function debounce(ms, cb) {
  var idTime = null;
  return function() {
    if (idTime) { clearTimeout(idTime); }
    idTime = setTimeout(cb, ms);
  };
}

function smartBrowser () {
  return ('querySelector' in document && 'localStorage' in window && 'addEventListener' in window) ? true : false;
}


// log(checkAttr(getByID('main_4_2'), 'type', 'radio'));
// log(checkAttr(getByID('main_4_2'), 'type'));
// Проверяем наличие аттрибута и/или его значение
function checkAttr (el, attr_name, attr_value) {
  el = (typeof el === 'string') ? getByID(el) : el;
  if (attr_name && !attr_value) {
    return el.hasAttribute(attr_name);
  } else if (attr_name && attr_value) {
    return (el.hasAttribute(attr_name) && el.getAttribute(attr_name) === attr_value) ? true : false;
  }
  err_trace('checkAttr => Not found any params: attr_name or attr_value');
  return null;
}

// TODO: ПЕРЕПИСАТЬ НА НОВУЮ ФУНКЦИЮ
/**
 * [_R description]
 * @param  string   –– u [url]
 * @param  boolean  –– d [если переданы параметры {}, то POST, иначе GET]
 * @param  function –– s [обработчик succes. Xhr передается]
 * @param  function –– e [обработчик error]
 * @param  digit    –– m [время задержки (5000ms default)]
 */
// Паттерн использования
// _R('/', null, function(Xhr) { console.log(Xhr.responseText);},function(err) {console.log(err)});
// function _R(u,d,s,e,m){var r=(window.XMLHttpRequest)?new XMLHttpRequest():new ActiveXObject("Microsoft.XMLHTTP"),ue="/nss/err"/*если скрипт не лежит на сервере*/,t;if(r){r.open((d)?"POST":"GET",u,true);r.onreadystatechange=function(){if(t){/*Если запрос сработал сразу чистим таймер*/clearTimeout(t)}if(r.readyState==4){if(r.status>=200&&r.status<400){if(s){s(r)}}else{if(u!=ue){_R(ue,"e="+u)}}}};if(e){r.onerror=e;/*назначаем обработчик ошибок для самого AJAX*/m=m||5000;t=setTimeout(function(){/*Если через 5с скрипт не ответил, то обрываем соединение и вызываем функцию обработчик*/r.abort();e(m)},m)}try{r.send(d||null)}catch(z){}}};
function _R(u, d, s, e, m, header) {
  var r = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"),
    ue = "/nss/err" /*если скрипт не лежит на сервере*/ ,
    t;
  if (r) {
    r.open((d) ? "POST" : "GET", u, true);
    // для Express нужен заголовок, возможно требуется еще это charset=UTF-8 где-то
    if (d) {
      if (header) {
        r.setRequestHeader('Content-Type', header);
      } else {
        r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }
    }
    r.onreadystatechange = function() {
      if (t) { /*Если запрос сработал сразу чистим таймер*/
        clearTimeout(t);
      }
      if (r.readyState === 4) {
        if (r.status >= 200 && r.status < 400) {
          if (s) {
            s(r);
          }
        } else {
          e(r);
          // if (u !== ue) {
          //   _R(ue, "e=" + u);
          // }
        }
      }
    };
    if (e) {
      r.onerror = e; /*назначаем обработчик ошибок для самого AJAX*/
      m = m || 5000;
      /*t = setTimeout(function() { //Если через 5с скрипт не ответил, то обрываем соединение и вызываем функцию обработчик
        r.abort();
        e(m);
      }, m);*/
    }
    try {
      r.send(preparePostParams(d) || null);
      // r.send(d || null);
    } catch (z) {}
  }
}


// превращаем {} в строку вида "k=v&k2=v2" для POST параметров
function preparePostParams(obj) {
  if (typeof obj === 'string') { return obj; }
  if (obj === null || obj === undefined || !(obj instanceof Object)) { return false; }
  var res = ''; // "k=v&k2=v2"
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      res += key+'='+obj[key]+'&';
    }
  }
  return res.replace(/&$/, '');
}

// NEW api for _ajx
window._ajx =function(){var r={content_types:{json:function(){return"application/json"},form_urlencoded:function(){return"application/x-www-form-urlencoded"},form_data:function(){return"multiparty/form-data"},text:function(){return"text/plain"}},Error_timeout:function(r){var e=new Error(r);this.message=e.message,this.stack=e.stack}},e=function(){};r.get=function(r,e,t){(e=e||{}).success=f(e.success),e.error=f(e.error),t=t||{};var n,o=c();o.open("GET",r,!0),s(o,t.headers),o.onreadystatechange=function(){var r;if(n&&clearTimeout(n),4===o.readyState)if(o.status>=200&&o.status<400){if(e.success){if((r=a(o))instanceof Error)return e.error(o,r);e.success(o,r)}}else{if((r=a(o))instanceof Error)return e.error(o,r);e.error(o,r)}};var i=parseInt(t.timeout,10)||5e3;n=u(o,r,i,e.error),o.send(null)};for(var t=["POST","PUT","DELETE"],n=0,o=t.length;n<o;n++){!function(e){r[e.toLowerCase()]=function(r,t,n,o){var p;(n=n||{}).success=f(n.success),n.error=f(n.error),o=o||{};var d=c();if(d.open(e,r,!0),s(d,o.headers),(t=i(o.headers||{},t))instanceof Error)return n.error(d,t);d.onreadystatechange=function(){var r;if(p&&clearTimeout(p),4===d.readyState)if(d.status>=200&&d.status<400){if(n.success){if((r=a(d))instanceof Error)return n.error(d,r);n.success(d,r)}}else{if((r=a(d))instanceof Error)return n.error(d,r);n.error(d,r)}};var l=parseInt(o.timeout,10)||5e3;p=u(d,r,l,n.error),d.send(t)}}(t[n])}function s(e,t){if(t)for(var n in t)if(t.hasOwnProperty(n)){var o=t[n];if(o===r.content_types.form_data())continue;e.setRequestHeader(n,o)}}function a(r){var e=r.getResponseHeader("Content-Type")||"";e=e.trim();var t=r.responseText;if(/^application\/json/.test(e))try{t=JSON.parse(r.responseText)}catch(r){return r}return t}function i(r,e){var t,n=r["Content-Type"]||r["content-type"]||r["content-Type"];if(!(e&&e instanceof Object))return e;if(/application\/json/.test(n))try{e=JSON.stringify(e)}catch(r){return r}else if(/application\/x-www-form-urlencoded/.test(n)){var o="";for(t in e)e.hasOwnProperty(t)&&(o+=t+"="+e[t]+"&");e=o.replace(/&$/,"")}else if(/multiparty\/form-data/.test(n)){var s=new FormData;for(t in e)e.hasOwnProperty(t)&&s.append(t,e[t]);e=s}return e}function u(e,t,n,o){return setTimeout(function(){o(e,new r.Error_timeout("Ajax timeout error "+n+"ms url="+t)),e.abort()},n)}function c(){var r=window.XMLHttpRequest?new XMLHttpRequest:new ActiveXObject("Microsoft.XMLHTTP");if(!r)throw new Error("Not found xhr");return r}function f(r){var t=!1;return r=r||e,function(){t||(t=!0,r.apply(null,arguments))}}return r}();

function getTarget (e) { return e && e.target || e.srcElement; }

function addScr(s,f,a){a=[];if(s){a.push(["text",s]);}if(f){a.push(["src",f],["async",true]);}H.appendChild(crEl("script",a));}

function addCss(s){if(s){H.appendChild(crEl("style",[],s));}}

function crEl(t,a,s,e){e=D.createElement(t);setArray(a,function(i,v){e[v[0]]=v[1];});if(s){e.appendChild(D.createTextNode(s));}return e;}

function setArray(a,f){for(var i=0,l=a.length;i<l;i++){if(a[i]!==undefined){f(i,a[i]);}}}


function escapeXss (str) {
  var lt = /</g,
      gt = />/g,
      ap = /'/g,
      ic = /"/g;
  str = str.toString().replace(lt, "&lt;").replace(gt, "&gt;").replace(ap, "&#39;").replace(ic, "&#34;");
  return str;
}


/* ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ */
// полифил для Object.keys
// log(objectKeys({1:2, 'test':124}))
function objectKeys (obj) {
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) { keys.push(key); }
  }
  return keys;
}


function objectSize (obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) { size++; }
  }
  return size;
}


//log(isEmptyHash({1:2}));
//log(isEmptyHash([1]));
function isEmptyHash (hash) {
  if (hash instanceof Object) {
    for (var i in hash) {
      if (hash.hasOwnProperty(i)) { return false; }
    }
    return true;
  } else { err_trace('isEmptyHash => hash: '+hash+' is not hash'); }
}


function isEmptyArray (array) {
  if (array instanceof Array) {
    return array.length === 0;
  } else { err_trace('isEmptyArray => array: '+array+' is not array'); }
}


// удалить элемент в массиве ТОЛЬКО ДЛЯ ОДНОМЕРННЫХ МАССИВОВ
function removeElArray (array, i) {
  if (array instanceof Array) {
    if (array instanceof Array) { err_trace('removeElArray => array: '+array+' is many-dimensional array; use rebuildArray'); return; }
    (i === 0) ? array.shift() : array.splice(i, i);
  } else { err_trace('removeElArray => array: '+array+' is not array'); }
}


// var ar = [["232", "БАНК ЗЕНИТ СОЧИ"], ["1", "ЮНИКРЕДИТ БАНК"], ["1481", "СБЕРБАНК РОССИИ"], ["1326", "АЛЬФА-БАНК"]];
// console.log(rebuildArray(ar, 2));
// пересобрать массив, выкинув не нужный элемент по индексу
// МОЖНО ИСПОЛЬЗОВАТЬ ДЛЯ ЛЮБЫХ МАССИВО
function rebuildArray (array, n) {
  var res = [];
  for (var i = 0, l = array.length; i < l; i++) {
    if (i === n) { continue; }
    res.push(array[i]);
  }
  return res;
}
/* END ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ */


/* COOKIES */
  // setCook("key", "val", "test.ru", 365*1000*60*60*24); // one year
  // function setCook(k, v, d, t, e) {e = new Date(); e.setTime(e.getTime() + t); D.cookie = k + "=" + v + "; path=/; domain=." + d + "; expires=" + e.toGMTString() + ";"; } // setCook('us_name','John',4,'/','127.0.0.1');
  // setCook('us_name','John',4,'test.ru');
function setCook(name, value, daysToLive, domain) {
  var cookie = name + "=" + encodeURIComponent(value);
  if (typeof daysToLive === "number"){
    cookie += "; max-age=" + (daysToLive * 60 * 60 * 24);
  } else {
    error('setCook => daysToLive is not digit');
  }
  cookie += "; path=/";
  cookie += "; domain="+domain;
  cookie += ";";
  D.cookie = cookie;
}
function getCookies(){return crH(D.cookie.split(/;\s*/),"=");}
function removeCookie(name, domain) {
  D.cookie = encodeURIComponent(name) +
    "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" +
    "; domain="+domain+
    "; path=/";
}


// из строки сделать hash
function crH(a, x, h) {
  h = {};
  setArray(a, function(i, v, s) {
    s = v.split(x);
    if (s[0] && s[1]) {
      h[s[0]] = s[1];
    }
  });
  return h;
}
/* END COOKIES */

/* WORK URL */
// возвращает хэш параметров из url {action: "login", refer: "/"}

function hashUrlParams (url) {
  url = url || W.location.search.replace(/^\?/, '');
  var res = {}, keys_values = url.split('&');
  for (var i = 0, l = keys_values.length; i < l; i++) {
    var key_value = keys_values[i].split('=');
    res[key_value[0]] = key_value[1];
  }
  return res;
}
/* END WORK URL*/

/* SUPPORT BUSINESS LOGIC */
// els - имена элементов ["input_login", "input_password"]
/* END SUPPORT BUSINESS LOGIC */


/* POLYFIL */
(function injection_polyfil () {

  if (!Object.keys) {
    Object.keys = objectKeys;
  }

  /**
   * Element.prototype.classList for IE8/9, Safari.
   * @see       https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
   */
  ;(function() {
      // Helpers.
      var trim = function(s) {
              return s.replace(/^\s+|\s+$/g, '');
          },
          regExp = function(name) {
              return new RegExp('(^|\\s+)'+ name +'(\\s+|$)');
          },
          forEach = function(list, fn, scope) {
              for (var i = 0; i < list.length; i++) {
                  fn.call(scope, list[i]);
              }
          };

      // Class list object with basic methods.
      function ClassList(element) {
          this.element = element;
      }

      ClassList.prototype = {
          add: function() {
              forEach(arguments, function(name) {
                  if (!this.contains(name)) {
                      this.element.className = trim(this.element.className +' '+ name);
                  }
              }, this);
          },
          remove: function() {
              forEach(arguments, function(name) {
                  this.element.className = trim(this.element.className.replace(regExp(name), ' '));
              }, this);
          },
          toggle: function(name) {
              return this.contains(name) ? (this.remove(name), false) : (this.add(name), true);
          },
          contains: function(name) {
              return regExp(name).test(this.element.className);
          },
          item: function(i) {
              return this.element.className.split(/\s+/)[i] || null;
          },
          // bonus
          replace: function(oldName, newName) {
              this.remove(oldName), this.add(newName);
          }
      };

      // IE8/9, Safari
      // Remove this if statements to override native classList.
      if (!('classList' in Element.prototype)) {
      // Use this if statement to override native classList that does not have for example replace() method.
      // See browser compatibility: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList#Browser_compatibility.
      // if (!('classList' in Element.prototype) ||
      //     !('classList' in Element.prototype && Element.prototype.classList.replace)) {
          Object.defineProperty(Element.prototype, 'classList', {
              get: function() {
                  return new ClassList(this);
              }
          });
      }

      // For others replace() support.
      if (window.DOMTokenList && !DOMTokenList.prototype.replace) {
          DOMTokenList.prototype.replace = ClassList.prototype.replace;
      }
  })();

})();


function CreateEvents() {
  var me = this;
  var _listeners = {};

  me.send = function(key, data) {
    var listeners_for_event = _listeners[key];
    if (listeners_for_event) {
      for (var i = 0, l = listeners_for_event.length; i < l; i++) {
        var event = listeners_for_event[i];
        event(data);
      }
    } else {
      err_trace('Send events => Not exist listeners for event_name: "' + key + '"');
    }
  };

  me.on = function(key, handler) {
    if (!_listeners[key]) {
      _listeners[key] = [];
    }
    _listeners[key].push(handler);
  };

  me.exist_listener = function(key) {
    return Boolean(_listeners[key]);
  };
}
GLOB.ee = new CreateEvents();

// cross browser click by element
function clickElById(id) {
  var el = typeof id === 'string' ? getByID(id) : id;
  if (el.click) {
    el.click();
  } else if (D.createEvent) {
    try {
      var event_obj = D.createEvent('MouseEvents');
      event_obj.initEvent('click', true, true);
      el.dispatchEvent(event_obj);
    } catch (err) { // TODO: Писать пользователю в глобальное окно об ошибках 2017.06.06
      sendError('D.createEvent("MouseEvents") => '+err);
    }
  } else { // TODO: Писать пользователю в глобальное окно об ошибках 2017.06.06
    sendError('Нет события click и нет метода createEvent => ');
  }
}

// проверка зависимостей
function checkDepends() {
  var depend = {};
  for (var i = 0, l = arguments.length; i < l; i++) {
    var name = arguments[i];
    if (!window[name]) {
      sendError('checkDepends => Not defined "'+name+'"');
    } else {
      depend[name] = window[name];
    }
  }
  return depend;
}


// deep_log({}, [], 'Hello')
function deep_log() {
  var arr = [];
  for (var i = 0, l = arguments.length; i < l; i++) {
    arr[i] = (typeof arguments[i] === 'object') ? JSON.stringify(arguments[i], null, 2) : arguments[i];
  }
  console.log.apply(console, arr);
}


/**
 * addCssClass: add css class
 * @deprecated
 * @param {HTMLDomElement} $el
 * @param {String} class_name 'my-class'
 */
function addCssClass($el, class_name) {
  $el.classList.add(class_name);
}


/**
 * removeCssClass: remove css class
 * @deprecated
 * @param  {HTMLDomElement} $el:
 * @param  {String} css_class: 'my-class'
 */
function removeCssClass($el, css_class) {
  $el.className = $el.className.replace(new RegExp('\\b'+css_class+'\\b', 'g'), '');
}


/**
 * CssClass
 * @param {HTMLDomElement} $el
 */
function CssClass($el) {
  var _classList = $el.classList;

  this.add = function (class_name) {
    _classList.add(class_name);
  };

  this.remove = function (class_name) {
    _classList.remove(class_name);
  };

  /**
   * hasClass
   * @param  {HTMLDomElement}  $el
   * @param  {String}  css_class
   * @return {Boolean}
   */
  this.has = function (css_class) {
    return _classList.contains(css_class);
  };
}



/**
 * redirect: cross browser redirect to url
 * @param  {String} url:
 * @return {Error}
 */
function redirect(url) {
  try {
    W.location.href = url;
  } catch (err) {
    try {
      // TODO: on mobile device required emulate event 'click'
      // if (navigator.userAgent.match(/MSIE\s(?!9.0)/))  {
      var referLink = document.createElement("a");
      referLink.href = url;
      document.body.appendChild(referLink);
      referLink.click();
    } catch (err) {
      return err;
    }
  }
}


// если выполнился javascript и это не бот, то шлем ajax запрос
(function() {
  var visitor_id = getCookies().v_id;
  var user_agent = W.navigator.userAgent;
  if (
    /http:\/\/yandex\.com\/bots/.test(user_agent) ||
    /http:\/\/www\.google\.com\/bot\.html/.test(user_agent) ||
    /http:\/\/www\.bing\.com\/bingbot\.htm/.test(user_agent) ||
    /rambler\/top100/.test(user_agent)
  ) {
    return;
  }
  // это рандомная строка, которая создана для запутывания реверс инжениринга
  _R('/aj/?action=i342shlolol&id='+HASH_KEY_FOR_REQUEST.for_v_id+'&refer='+encode(D.referrer || ''), null, function() {}, function() {});
}());


