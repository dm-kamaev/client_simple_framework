// TODO:
// 1) Only one css add
// 2) Work with child component and unique elements
// 3)
function MiniFramework () {

}

MiniFramework.extend = function (Class) {
  Class.prototype = Object.create(MiniFramework.prototype);
  Class.prototype.constructor = Class;
};

MiniFramework.prototype.save_mount_id = function (id) {
  this._mount_id = id;
};


MiniFramework.prototype.get_mount_id = function () {
  return this._mount_id;
};

MiniFramework.register = function (components, hash_components) {
  hash_components = hash_components || {};
  for (var i = 0, l = components.length; i < l; i++) {
    var component = components[i];
    var component_name = component.get_component_name().toLowerCase();
    if (hash_components[component_name]) {
      throw new Error('Already register component '+component_name);
    }
    hash_components[component_name] = component;

    if (component.get_css) {
      W.addCss(component.get_css());
    }
  }

  D.body.addEventListener('click', function (e) {
    var t = getTarget(e);
    var action = t.getAttribute('data-mini-frm-action')

    if (!action) {
      return;
    }

    var parts = action.split('->');
    var event = parts[0];
    var class_name_and_method = parts[1];
    if (event !== 'click') {
      return;
    }

    parts = class_name_and_method.split('#');
    var component_name = parts[0];
    var method_name = parts[1];
    var argv = [ e ];

    var res = MiniFramework.$_parse_argv(method_name, argv);
    method_name = res.method_name;
    argv = res.argv;


    var component = hash_components[component_name];
    if (!component) {
      return console.error('Not found components "'+component_name+'"');
    }
    console.log(component_name, method_name, argv);
    if (!component[method_name]) {
      return console.error('Not found method = '+component_name+'.'+method_name+' from component ', component);
    }
    component[method_name].apply(component, argv);
  });


  return hash_components;
};

/**
 * $_parse_argv - if exist params in data-mini-frm-action then parse arguments else nothing
 * NOT SUPPORT object in params(like JSON.stringify({ 1: true, 2})), becuse spit by ','
 * @example - data-mini-frm-action="click->bank_list#add('+id+')"
 * @param  {string} method_name - 'bank_list#add(input_add_bank)'
 * @param  {Array[ Event ]} argv
 * @return {{ method_name: string, argv: Array[ Event ], }}
 */
MiniFramework.$_parse_argv = function (method_name, argv) {
  if (/\(|\)/.test(method_name)) {
    console.log('HERE');
    parts = method_name.split('(');
    method_name = parts[0];
    params = parts[1].replace(/\)$/, '');
    argv = argv.concat(params.split(','));
  }
  return { method_name: method_name, argv };
};



function Input_add_bank() {
  MiniFramework.call(this);

  this.get_component_name = function () {
    return 'Input_add_bank';
  };

  this.get_css =function () {
    return '.input{width:300px;padding:5px 0 }';
  };


  this.render = function () {
    var id = this.get_mount_id()+'_input';
    getByID(this.get_mount_id()).innerHTML = (
      '<div>'+
        '<label for="">Добавить банк</label><br/>'+
        '<input id='+id+' class=input type="text" value=""/>'+
        '<button data-mini-frm-action="click->bank_list#add('+id+')" type=button>Add</button>'+
      '</div>'
    );
  };
}
MiniFramework.extend(Input_add_bank);


function Bank_list() {
  MiniFramework.call(this);

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
    var bank_name = getByID(id).value;
    this.list.push({
      id: this.list.length,
      name: bank_name,
    });
    this.render(this.list);
  };

  this.remove = function (e, b) {
    var t = getTarget(e);
    var bank_id = parseInt(t.getAttribute('data-bank-id'), 10);
    console.log('remove', t, t.getAttribute('data-bank-id'));

    this.list = this.list.filter(el => {
      return bank_id !== el.id
    });
    this.render(this.list);
  };

  this.render = function (list) {
    this.list = list;
    getByID(this.get_mount_id()).innerHTML = (
      '<div>'+
        list.map(el => {
          return '<p class=bank_name>'+el.name+' <span data-bank-id='+el.id+' data-mini-frm-action="click->bank_list#remove" class=cross>X</span></p>';
        }).join('')+
      '</div>'
    );
  };
}
MiniFramework.extend(Bank_list);


function Date_picker() {
  MiniFramework.call(this);

  this.get_component_name = function () {
    return 'Date_picker';
  };


  this.render = function (list) {
    getByID(this.get_mount_id()).innerHTML = (
        `<div>
          <button type="button" data-mini-frm-action="click->date_picker#wrong_method">Another module</button>
        </div>`
    );
  };
}
MiniFramework.extend(Date_picker);


var input_add_bank = new Input_add_bank();
var bank_list = new Bank_list();

var HASH_COMPONENTS = MiniFramework.register([ bank_list, input_add_bank ]);
console.log(HASH_COMPONENTS);

var date_picker =  new Date_picker();
var HASH_COMPONENTS_2 = MiniFramework.register([ date_picker ]);
date_picker.save_mount_id('date_picker');
date_picker.render();


input_add_bank.save_mount_id('add_bank');
bank_list.save_mount_id('list_bank');

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
