(function() {
  'use strict';

  var intervalFn;
  var thresholds = {
    good: 100,
    acceptable: 300
  };

  var jsdom = {
    apps : [],
    servers: []
  };

  function getLatencyUI(delta) {
    var maxWidth = $('.tab-pane.active').find('> table th').last().width() - 50;
    var width = Math.min(delta/2, maxWidth);
    var latencyClass = 'unacceptable';

    if (delta < thresholds.good) {
      latencyClass = 'good';
    }
    else if (delta < thresholds.acceptable) {
      latencyClass = 'acceptable';
    }

    return '\
      <div class="bg-latency '+latencyClass+'" style="width:'+width+'px"></div>\
      <small>' + parseInt(delta) + 'ms</small>';
  }

  function setup() {
    $.getJSON('user.config.json')
      .done(function (config) {
        addApps(config.apps);
        addServers(config.servers);
        setTimeout(updateInfo, 1000);
      });

    $.ajaxSetup({
      scriptCharset: "utf-8",
      contentType: "application/json; charset=utf-8"
    });
  }

  function addApps(apps) {
    apps.forEach(function (url) {
      var $tr = $('\
        <tr>\
          <td role="url">\
            <a href="' + url + '" target="_blank">' + url + '</a>\
          </td>\
        </tr>');
      var $status = $('<td role="status"></td>');
      var $latency = $('<td role="latency">reaching website...</td>');

      $tr.append($status).append($latency);
      $('#apps').find('table').append($tr);

      jsdom.apps.push({
        url: url,
        $status: $status,
        $latency: $latency
      });
    });
  }

  function addServers(servers) {
    servers.forEach(function (ip) {
      var $tr = $('\
        <tr>\
          <td role="ip">\
            <a href="' + ip + '" target="_blank">' + ip + '</a>\
          </td>\
        </tr>');
      var $status = $('<td role="status"></td>');
      var $latency = $('<td role="latency">reaching server...</td>');

      $tr.append($status).append($latency);
      $('#servers').find('table').append($tr);

      jsdom.servers.push({
        ip: ip,
        $status: $status,
        $latency: $latency
      });
    });
  }

  function updateInfo() {
    var token = false;

    jsdom.apps.forEach(function (app) {
      setTimeout(function () {
        var proxyUrl = 'http://whateverorigin.org/get?url={0}&callback=?';
        $.getJSON(proxyUrl.replace('{0}', encodeURIComponent(app.url)))
          .done(function (_, __, jqXHR) {
            app.$status.text(jqXHR.status + ' : ' + jqXHR.statusText);
          })
          .fail(function (jqXHR) {
            app.$status.text(jqXHR.status + ' : ' + jqXHR.statusText + '');
          });
      }, 0);

      setTimeout(function () {
        ping(app.url)
          .then(function (delta) {
            app.$latency.html(getLatencyUI(delta));
          })
          .catch(function (err) {
            app.$latency.text('Could not reach URL: ' + err);
          });
      }, Math.random() * 1000 * 10);
    });

    jsdom.servers.forEach(function (server) {
      setTimeout(
        function () {
          ping(server.ip)
            .then(function (delta) {
              server.$latency.html(getLatencyUI(delta));
            })
            .catch(function (err) {
              server.$latency.text('Could not reach URL: ' + err);
            });
        }, Math.random() * 1000 * 10);
    });
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
    setup();
    setUpdateFrequency();
    document.getElementById('interval').onchange = setUpdateFrequency;
  });
}());
