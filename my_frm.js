// FRAMEWROK FOR REACTION VIA DATA-ATTRIBUTE

function MyFrm () {

}

MyFrm.DEBUG = false;
MyFrm.logger = (MyFrm.DEBUG) ? console.log : function () {};

/**
 * action - create data attribute
 * @param  {string} action - 'bank_list.add(1)'
 * @return {string} - 'data-my-frm-action__click=bank_list.add(1)'
 */
MyFrm.prototype.action_click = function (action) {
  return MyFrm.DATA_ACTION_ATTRIBUTE+'__click'+'="'+action+'"';
};



MyFrm.prototype.set_mount_id = function (id) {
  this._mount_id = id;
};


MyFrm.prototype.get_mount_id = function () {
  return this._mount_id;
};


MyFrm.DATA_ACTION_ATTRIBUTE = 'data-my-frm-action';


/**
 * extend_class
 * @param  {class} Class
 */
MyFrm.extend_class = function (Class) {
  Class.prototype = Object.create(MyFrm.prototype);
  Class.prototype.constructor = Class;
};


/**
 * register - load css to
 * @param  {MyFrm[]} components
 * @param  {[{ [key: string]: class }]} hash_components
 * @return {{ [key: string]: class }}
 */
MyFrm.register = function (components, hash_components) {
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

  return hash_components;
};


/**
 * register_events - register handlers for DOM events
 * @param  {{ [key: string]: class }} hash_components
 */
MyFrm.register_events = function (hash_components) {
  var component_names = Object.keys(hash_components);
  var on_ids = {};
  var on_body = {};
  var events = [ 'click' ];

  var i,l, component, mount_id;
  for (i = 0, l = component_names.length; i < l; i++) {
    var component_name = component_names[i];
    component = hash_components[component_name];
    mount_id = component.get_mount_id();
    if (mount_id) {
      on_ids[component_name] = component;
    } else {
      on_body[component_name] = mount_id;
    }
  }

  component_names = Object.keys(on_ids);
  for (i = 0, l = component_names.length; i < l; i++) {
    component = on_ids[component_names[i]];
    mount_id = component.get_mount_id();
    for (var j = 0, l1 = events.length; j < l1; j++) {
      var event_name = events[j];
      getByID(mount_id).addEventListener(event_name, MyFrm.event_handler('click', on_ids));
    }
  }

  // TODO: make mount in D.body, if not exist mout id
  // use hash on_body
};


/**
 * event_handler
 * @param  {string} event_name - 'click'
 * @param  {{ [key: string]: class }} hash_components
 * @return {function(Event)}
 */
MyFrm.event_handler = function (event_name, hash_components) {
  return function (e) {
    var t = getTarget(e);
    var action = t.getAttribute(MyFrm.DATA_ACTION_ATTRIBUTE+'__'+event_name);
    console.log(MyFrm.DATA_ACTION_ATTRIBUTE+'__'+event_name, action);

    if (!action) {
      return;
    }

    // var parts = action.split('->');
    // var event = parts[0];
    // var class_name_and_method = parts[1];
    // if (event !== event_name) {
    //   return;
    // }

    var parts = action.split('.');
    var component_name = parts[0];
    var method_name = parts[1];
    var argv = [ e ];

    var res = MyFrm.parse_argv(method_name, argv);
    method_name = res.method_name;
    argv = res.argv;


    var component = hash_components[component_name];
    if (!component) {
      return console.error('Not found components "'+component_name+'"');
    }

    MyFrm.logger(component_name, method_name, argv);

    if (!component[method_name]) {
      return console.error('Not found method = '+component_name+'.'+method_name+' from component ', component);
    }

    // disable bubbling, for fix problem with conflict component
    e.stopPropagation();
    component[method_name].apply(component, argv);
  };
};


/**
 * $_parse_argv - if exist params in data-mini-frm-action then parse arguments else nothing
 * NOT SUPPORT object in params(like JSON.stringify({ 1: true, 2})), becuse spit by ','
 * @example - data-mini-frm-action="click->bank_list#add('+id+')"
 * @param  {string} method_name - 'bank_list#add(input_add_bank)'
 * @param  {Array[ Event ]} argv
 * @return {{ method_name: string, argv: Array[ Event ], }}
 */
MyFrm.parse_argv = function (method_name, argv) {
  var parts, params;
  if (/\(|\)/.test(method_name)) {
    parts = method_name.split('(');
    method_name = parts[0];
    params = parts[1].replace(/\)$/, '');
    argv = argv.concat(params.split(','));
  }
  return { method_name: method_name, argv: argv };
};
