import {execa as execPromise} from 'execa';
import {execSync} from 'child_process';

function escape(cmd) {
  return '\'' + cmd.replace(/'/g, "'\\''") + '\'';
};

function serializeArgs(args) {
  var argsStr = '';
  for (var i = 0; i < args.length; i++) {
    argsStr += ' ' + escape(args[i]);
  }
  return argsStr;
}

function serializeCommand(cmd, args) {
  if (typeof args === 'string') {
    return  cmd + ' ' + args;
  }
  else {
    return cmd + serializeArgs(args);
  }
}

var jsonExecFuncs = {
  sync: function jsonExecSync(cmd, args, env) {
    cmd = serializeCommand(cmd, args)
    var result = execSync(cmd, {env: env});
    return JSON.parse(result.toString());
  },
  promise: function jsonExecPromise(cmd, args, env) {
    args = (typeof args === 'string') ? [args] : args;
    return execPromise(cmd, args, {env: env}).then(function(result) {
      return JSON.parse(result.stdout);
    });
  }
};

export default function(options) {
  if (!options || options.mode === undefined) {
    throw "civicrm-cv: Please specify \'mode\' option.";
  }
  if (!jsonExecFuncs[options.mode]) {
    throw "civicrm-cv: Invalid \'mode\' option";
  }

  return function(args) {
    const cmd = 'cv';

    var env = {};
    for (var key in process.env) {
      env[key] = process.env[key];
    }
    env.CV_OUTPUT = 'json';

    return jsonExecFuncs[options.mode].apply(null, [cmd, args, env]);
  };
};
