var MyFrm = window.MyFrm;

function Input_add_bank() {
  var me = this;

  MyFrm.call(this);

  me.get_component_name = function () {
    return 'Input_add_bank';
  };

  me.get_css =function () {
    return '.input{width:300px;padding:5px 0 }';
  };

  me.hide_error = function () {
    getByID(me._error_id).innerHTML = '';
    getByID(me.input_id).style.borderColor = '';
  };

  me.show_error = function (msg) {
    getByID(me._error_id).innerHTML = msg;
    getByID(me.input_id).style.borderColor = 'red';
  };

  me.render = function () {
    me.input_id = me.get_mount_id()+'_input';
    me._error_id = me.get_mount_id()+'_error';
    getByID(me.get_mount_id()).innerHTML = (
      '<div>'+
        '<label for="">Добавить банк</label><br/>'+
        '<input id='+me.input_id+' class=input type="text" value=""/>'+
        '<p id='+me._error_id+' style=color:red></p>'+
        '<button '+me.action_click('bank_list.add('+me.input_id+')')+' type=button>Add</button>'+
      '</div>'
    );
  };
}
MyFrm.extend_class(Input_add_bank);


function Bank_list(input_add_bank) {
  var me = this;
  MyFrm.call(this);

  this.get_component_name = function () {
    return 'bank_list';
  };

  this.get_css = function () {
    return (
      '.bank_name{font-size:120%;}'+
      '.cross{color:#999;cursor:pointer}'
    );
  };

  this.add = function (e, id) {
    input_add_bank.hide_error();

    var bank_name = getByID(id).value;
    if (!bank_name) {
      return input_add_bank.show_error('* Не указан банк');
    }
    this.list.push({
      id: this.list.length,
      name: bank_name,
    });
    this.render(this.list);
    getByID(id).value = '';
  };

  this.remove = function (e) {
    var t = getTarget(e);
    var bank_id = parseInt(t.getAttribute('data-bank-id'), 10);
    MyFrm.logger('remove', t, t.getAttribute('data-bank-id'));

    this.list = this.list.filter(function(el) {
      return bank_id !== el.id;
    });
    this.render(this.list);
  };

  this.render = function (list) {
    this.list = list;
    getByID(this.get_mount_id()).innerHTML = (
      '<div>'+
        list.map(function(el) {
          return '<p class=bank_name>'+el.name+' <span data-bank-id='+el.id+' '+me.action_click('bank_list.remove')+' class=cross>X</span></p>';
        }).join('')+
      '</div>'
    );
  };
}
MyFrm.extend_class(Bank_list);


function Date_picker() {
  var me = this;
  MyFrm.call(this);

  this.get_component_name = function () {
    return 'Date_picker';
  };


  this.render = function () {
    getByID(this.get_mount_id()).innerHTML = (
      '<div>'+
        '<button type="button" '+me.action_click('date_picker.not_exist')+'>Another module</button>'+
      '</div>'
    );
  };
}
MyFrm.extend_class(Date_picker);

D.addEventListener('click', function (e) {
  console.log(getTarget(e));
});

var input_add_bank = new Input_add_bank();
var bank_list = new Bank_list(input_add_bank);

input_add_bank.set_mount_id('add_bank');
bank_list.set_mount_id('list_bank');


var HASH_COMPONENTS = MyFrm.register([ bank_list, input_add_bank ]);
MyFrm.logger(HASH_COMPONENTS);

MyFrm.register_events(HASH_COMPONENTS);

var date_picker = new Date_picker();
var HASH_COMPONENTS_2 = MyFrm.register([ date_picker ]);
date_picker.set_mount_id('date_picker');
date_picker.render();

MyFrm.register_events(HASH_COMPONENTS_2);



input_add_bank.render();
bank_list.render([{
  id: 1,
  name: 'Юникредит'
}, {
  id: 2,
  name: 'Райффайзен'
}, {
  id: 3,
  name: 'Коммерцбанк'
}]);



