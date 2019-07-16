function Observable(value) {
  var me = this;
  var listeners = [];

  function notify(newValue) {
    listeners.forEach(function(listener) {
      listener(newValue);
    });
  }

  me.set = function (newValue) {
    if (arguments.length && newValue !== value) {
      value = newValue;
      notify(newValue);
    }
  };

  me.get = function () {
    return value;
  };

  me.subscribe = function(listener) {
    listeners.push(listener);
  };

}

function InputBinder(id) {
  var me = this;

  me.get_id = function () {
    return id;
  };


  me.bind_value = function (observable) {
    var $input = getByID(id);
    $input.value = observable.get();

    observable.subscribe(function() {
      $input.value = observable.get();
    });

    $input.addEventListener('input', function() {
      observable.set($input.value);
    });
  };
}



function RadioBinder(id) {
  var me = this;

  me.get_id = function () {
    return id;
  };

  me.load_state = function (obs_radio_buttons) {
    var $list = getByID(id).querySelectorAll('input[type=radio]');
    var res = [];
    for (var i = 0, l = $list.length; i < l; i++) {
      var $el = $list[i];
      console.log($el.getAttribute('checked'));
      res.push({
        id: $el.id,
        value: $el.value,
        checked: $el.checked
      });
    }
    console.log('SET', res);
    obs_radio_buttons.set(res);
  };

  me.bind_value = function (observable) {
    // var $radio_buttons = getByID(id);
    // var $list = $radio_buttons.querySelectorAll('input[type=radio]');
    // var list = observable.get();
    // for (var i = 0, l = list.length; i < l; i++) {
    //   var el = list[i];
    //   console.log($list[i].value, el.value);
    //   if ($list[i].value === el.value) {
    //     console.log('HERE');
    //     $list[i].checked = true;
    //   }
    // }
    // input.value = observable.get();

    // observable.subscribe(function() {
    //   input.value = observable.get();
    // });

    getByID(id).addEventListener('click', function(e) {
      var t = getTarget(e);
      console.log(t);
      if (t.value) {
        me.load_state(observable);
        // console.log(t.value);
        // observable.get().map(function(el) {
        //   if (el.id === t.id) {
        //     el.checked = true;
        //   }
        //   return el;
        // });
      }
      // observable.set(input.value);
    });
  };
}

// function bindValue(input, observable) {
//   input.value = observable();
//   observable.subscribe(function() {
//     input.value = observable();
//   });
//   input.addEventListener('input', function() {
//     observable(input.value);
//   });
// }

var hashRegisterElements = {};

hashRegisterElements['bind_input'] = new InputBinder('bind_input');

var obs_val = new Observable(3);

hashRegisterElements['bind_input'].bind_value(obs_val);

obs_val.subscribe(function(val) {
  console.log('new value=', val);
  if (!/^\d+$/.test(val)) {
    getByID('bind_input_error').innerHTML = '* Введите число';
    getByID('bind_input').style.borderColor = 'red';
  } else {
    getByID('bind_input_error').innerHTML = '';
    getByID('bind_input').style.borderColor = '';
  }
});


// setInterval(function() {
//   obs_val.set(Math.random());
// }, 1000);


hashRegisterElements['bind_radio_buttons'] = new RadioBinder('bind_radio_buttons');

var obs_radio_buttons = new Observable([]);

hashRegisterElements['bind_radio_buttons'].load_state(obs_radio_buttons);

hashRegisterElements['bind_radio_buttons'].bind_value(obs_radio_buttons);


setInterval(function() {
  // obs_radio_buttons.set([ { id: 1, value: 'email' }, { id: 2, value: 'phone'}, { id: 3, value: 'mail' }]);
  console.log(JSON.stringify(obs_radio_buttons.get()));
}, 1000);



