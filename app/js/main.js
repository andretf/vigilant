(function() {
  'use strict';
  var intervalFn;
  var jsdom = {
    pane: {
      active: $('.tab-pane.active'),
      apps: $(document.getElementById('apps')),
      servers: $(document.getElementById('servers'))
    }
  };

  var vigilant = (function() {
    var proxyUrl = 'http://whateverorigin.org/get?url={0}&callback=?';
    var apps = [], servers = [], pipeStack = [];

    var item = function (address, $uiStatus, $uiLatency) {
      var result = {
        address: address,
        ui: {
          $status: $uiStatus,
          $latency: $uiLatency,
          updateStatus: function (code, text) {
            result.ui.$status.text(code + ' : ' + text);
          },
          updateLatency: function (latency) {
            if (jsdom.pane.active[0].id === 'servers') {
              var statusHtml = '<span class="btn btn-{0}">{1}</span>';
              if (isNaN(latency)) {
                result.ui.$status.html(statusHtml.replace('{0}', 'danger').replace('{1}', ''));
                return;
              }
              result.ui.$status.html(statusHtml.replace('{0}', 'success').replace('{1}', ''));
            }

            result.ui.$latency.html(getLatencyUI(latency));
          }
        }
      };

      return result;
    };

    function add(address, $uiStatus, $uiLatency) {
      var newItem = new item(address, $uiStatus, $uiLatency);
      this.push(newItem);
      return this;
    }
    apps.add = add;
    servers.add = add;

    return {
      threshold: {
        good: 100,
        acceptable: 300
      },
      apps: apps,
      servers: servers,

      getHttpStatus: function (index) {
        this.idle = false;
        var response;
        var item = vigilant.apps[index |= 0];

        if (item !== undefined) {
          setTimeout(function () {
            $.ajax({
                dataType: "json",
                url: proxyUrl.replace('{0}', encodeURIComponent(item.address)),
                timeout: 2000
              })
              .always(function (first, textStatus, last) {
                response = textStatus === 'success' ? last : first;
                item.ui.updateStatus(response.status, response.statusText);
                if (++index === vigilant.apps.length) {
                  return vigilant.resolve();
                }
                vigilant.getHttpStatus(index);
              });
          }, 0);
        }
        return this;
      },

      ping: function (category, index) {
        this.idle = false;
        index |= 0;
        var item = vigilant[category][index];

        setTimeout(function () {
          ping(item.address, 0.75)
            .then(function (delta) {
              item.ui.updateLatency(delta);
            })
            .catch(function (delta) {
              item.ui.updateLatency(delta);
            })
            .then(function () {
              if (++index === vigilant[category].length) {
                return vigilant.resolve();
              }
              vigilant.ping(category, index);
            });
        }, 0);

        return this;
      },

      then: function(callback){
        pipeStack.push(callback);
        return this;
      },
      resolve: function () {
        var callback = pipeStack.shift();
        if (typeof callback === 'function') {
          callback();
        }
        if (!pipeStack.length){
          this.idle = true;
        }
      },
      idle: true
    }
  }());


  function getLatencyUI(delta) {
    if (delta < 0){
      return 'Could not reach address.';
    }

    var maxWidth = jsdom.pane.active.find('> table th').last().width() - 50;
    var width = Math.min(delta / 2, maxWidth);
    var latencyClass =
      delta < vigilant.threshold.good ? 'good' :
        delta < vigilant.threshold.acceptable ? 'acceptable' : 'unacceptable';
    return '\
      <div class="bg-latency ' + latencyClass + '" style="width:' + width + 'px"></div>\
      <small>' + parseInt(delta) + 'ms</small>';
  }

  function setup() {
    var onResolve = null;

    function resolve() {
      if (typeof onResolve === 'function') {
        onResolve();
      }
    }

    function addAll(config, category) {
      var list = config[category];
      list.forEach(function (addr) {
        var $tr = $('\
        <tr>\
          <td>\
            <a href="' + addr + '" target="_blank">' + addr + '</a>\
          </td>\
        </tr>');
        var $status = $('<td></td>');
        var $latency = $('<td>reaching...</td>');

        $tr.append($status).append($latency);
        jsdom.pane[category].find('table').append($tr);

        vigilant[category].add(addr, $status, $latency);
      });
    }

    $.getJSON('user.config.json')
      .done(function (config) {
        addAll(config, 'apps');
        addAll(config, 'servers');
        resolve();
      });

    $.ajaxSetup({
      scriptCharset: "utf-8",
      contentType: "application/json; charset=utf-8"
    });

    return {
      then: function(callback){
         onResolve = callback;
      }
    }
  }

  function updateInfo() {
    if (vigilant.idle) {
      jsdom.pane.active = $('.tab-pane.active');
      if (jsdom.pane.active[0].id === 'apps') {
        vigilant.getHttpStatus().then(function () {
          vigilant.ping('apps');
        });
      }
      else if (jsdom.pane.active[0].id === 'servers') {
        vigilant.ping('servers');
      }
    }
  }

  function setUpdateFrequency() {
    var validValues = [1, 30, 300, 1800, 3600, 14400];
    var seconds = validValues[document.getElementById('interval').value];
    if (seconds) {
      clearInterval(intervalFn);
      intervalFn = setInterval(updateInfo, seconds * 1000);
    }
  }

  $(document).ready(function () {
    setTimeout(function(){
      setup().then(updateInfo);
    }, 100);
    setUpdateFrequency();
    document.getElementById('interval').onchange = setUpdateFrequency;
  });
}());
