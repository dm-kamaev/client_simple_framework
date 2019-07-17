/**
 * Observable
 * @param {any} value
 */
function Observable(value) {
  var me = this;
  var _listeners = [];

  /**
   * notify
   * @param  {any} new_value
   */
  function notify(new_value) {
    _listeners.forEach(function(listener) {
      listener(new_value);
    });
  }

  /**
   * set - set new value and dispatch lsiteners
   * @param {any} new_value
   */
  me.set = function (new_value) {
    if (arguments.length && new_value !== value) {
      value = new_value;
      notify(new_value);
    }
  };


  /**
   * get
   * @return {any}
   */
  me.get = function () {
    return value;
  };


  /**
   * subscribe - add listener
   * @param  {function(new_value: any)} listener
   */
  me.subscribe = function(listener) {
    _listeners.push(listener);
  };

}

/**
 * Input_bind
 * @param {string} id - input id
 */
function Input_bind(id) {
  var me = this;

  /**
   * load_state - from DOM tree
   * @param  {Observable} observable
   */
  function load_state(observable) {
    observable.set(getByID(id).value);
  }

  /**
   * bind_value
   * @param  {[Observable]} observable
   * @return {Observable}
   */
  me.bind_value = function (observable) {
    observable = observable || new Observable();

    var $input = getByID(id);

    load_state(observable);

    observable.subscribe(function() {
      $input.value = observable.get();
    });

    $input.addEventListener('input', function() {
      observable.set($input.value);
    });

    return observable;
  };
}


/**
 * Radio_bind
 * @param {string} id - id for element which unite groups radio elements
 * @param {Array<{ id: string }>} els
 */
function Radio_bind(id, els) {
  var me = this;

  /**
   * load_state - from DOM tree
   * @param  {Observable} observable
   */
  function load_state(obs_radio_buttons) {
    var res = [];
    for (var i = 0, l = els.length; i < l; i++) {
      var $el = getByID(els[i].id);
      res.push({
        id: $el.id,
        value: $el.value,
        checked: $el.checked
      });
    }
    obs_radio_buttons.set(res);
  }


  /**
   * bind_value
   * @param  {[Observable]} observable
   * @return {Observable}
   */
  me.bind_value = function (observable) {
    observable = observable || new Observable();
    load_state(observable);

    observable.subscribe(function() {
      observable.get().forEach(function (el) {
        getByID(el.id).checked = el.checked;
      });
    });

    getByID(id).addEventListener('click', function(e) {
      var t = getTarget(e);
      if (t.value) {
        load_state(observable);
      }
    });

    return observable;
  };
}


// Куда регистрируем все элементы c ленивым data-bind
var hashRegisterElements = {};

hashRegisterElements['bind_input'] = new Input_bind('bind_input');

var obs_val = hashRegisterElements['bind_input'].bind_value();

obs_val.subscribe(function(val) {
  console.log('new value=', val);
  // TODO: maybe delegate methods to class Input_bind
  if (!/^\d+$/.test(val)) {
    getByID('bind_input_error').innerHTML = '* Введите число';
    getByID('bind_input').style.borderColor = 'red';
  } else {
    getByID('bind_input_error').innerHTML = '';
    getByID('bind_input').style.borderColor = '';
  }
});


// setInterval(function() {
//   obs_val.set(Math.random()+1000);
// }, 1000);


hashRegisterElements['bind_radio_buttons'] = new Radio_bind('bind_radio_buttons', [{
  id: 'bind_radio_buttons_1',
}, {
  id: 'bind_radio_buttons_2',
}, {
  id: 'bind_radio_buttons_3',
}]);

var obs_radio_buttons = hashRegisterElements['bind_radio_buttons'].bind_value();


setInterval(function() {
  // obs_radio_buttons.set([ { id: 1, value: 'email' }, { id: 2, value: 'phone'}, { id: 3, value: 'mail' }]);
  console.log(JSON.stringify(obs_radio_buttons.get()));
}, 1000);



