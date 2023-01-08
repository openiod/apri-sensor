import { c as create_ssr_component, a as subscribe, k as set_store_value, v as validate_component, e as escape, d as each, h as add_attribute } from './index-5affc850.js';
import { c as connectionStatus, n as notifications, B as Button } from './Button-d6898c4f.js';
import { w as writable } from './index2-403db956.js';
import { faWindowClose } from '@fortawesome/free-solid-svg-icons/faWindowClose';
import { faWifi } from '@fortawesome/free-solid-svg-icons/faWifi';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';

const fetchTimeout = (url, ms, options = {}) => {
  const controller = new AbortController();
  const promise = fetch(url, options);
  if (options.signal)
    options.signal.addEventListener("abort", () => controller.abort());
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};
function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5e3 } = options;
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  options.signal = controller.signal;
  return fetchTimeout(resource, timeout, options);
}
async function apiRequest(url, config) {
  const response = await fetchWithTimeout(url, config);
  return response;
}
const get = (url, config) => {
  config.method = "GET";
  return apiRequest(url, config);
};
const deleteRequest = (url, config) => {
  config.method = "DELETE";
  config.headers = {
    "Content-type": "application/json; charset=UTF-8"
  };
  console.log("DELETE");
  console.log(config);
  return apiRequest(url, config);
};
const post = (url, config) => {
  config.method = "POST";
  config.headers = {
    "Content-type": "application/json; charset=UTF-8"
  };
  return apiRequest(url, config);
};
const put = (url, config) => {
  config.method = "PUT";
  return apiRequest(url, config);
};
const patch = (url, config) => {
  config.method = "PATCH";
  return apiRequest(url, config);
};
const generateKeypair = () => _generateKeypair();
const exportPublicKey = (url, config) => _exportPublicKey(url, config, publicKeyToExport);
const API = {
  get,
  delete: deleteRequest,
  post,
  put,
  patch,
  generateKeypair,
  exportPublicKey
};
const protocol = "http://";
let apiConfig = {
  urlAvahi: protocol + "IDXX.local",
  urlHotspot: protocol + "10.42.0.1",
  url: protocol + "localhost",
  port: "4000",
  apiPath: "/nmcli/api/v1"
};
const getNmcliConnectionShow = async () => {
  return API.get(apiConfig.url + ":" + apiConfig.port + apiConfig.apiPath + "/connection/show", { timeout: 5e3 });
};
const getNmcliDeviceHotspot = () => {
  return API.get(apiConfig.url + ":" + apiConfig.port + apiConfig.apiPath + "/device/hotspot", { timeout: 4e3 });
};
const postNmcliAddWifiNetwork = (param) => {
  console.log("postNmcliAddWifiNetwork");
  console.log(param);
  var _data = param;
  _data.passwd = "SCP" + _data.passwd;
  console.log(_data);
  return API.post(apiConfig.url + ":" + apiConfig.port + apiConfig.apiPath + "/accesspoint/connect", { body: JSON.stringify(_data), type: "formData", timeout: 5e3 });
};
const postNmcliDeviceConnect = (connection) => {
  return API.post(apiConfig.url + ":" + apiConfig.port + apiConfig.apiPath + "/device/connect", { body: JSON.stringify(connection), timeout: 5e3 });
};
const postReboot$1 = (connection) => {
  return API.post(apiConfig.url + ":" + apiConfig.port + apiConfig.apiPath + "/reboot", { body: JSON.stringify(connection), timeout: 5e3 });
};
const deleteNmcliConnection = async (connection) => {
  return API.delete(apiConfig.url + ":" + apiConfig.port + apiConfig.apiPath + "/connection/delete", { body: JSON.stringify(connection), timeout: 3e3 });
};
Object.freeze();
const modalActive = writable(false);
const modalContent = writable("");
const modalAction = writable("");
const modalResult = writable("");
const modalParam = writable({});
const Modal = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $modalActive, $$unsubscribe_modalActive;
  let $modalContent, $$unsubscribe_modalContent;
  let $modalResult, $$unsubscribe_modalResult;
  let $modalAction, $$unsubscribe_modalAction;
  $$unsubscribe_modalActive = subscribe(modalActive, (value) => $modalActive = value);
  $$unsubscribe_modalContent = subscribe(modalContent, (value) => $modalContent = value);
  $$unsubscribe_modalResult = subscribe(modalResult, (value) => $modalResult = value);
  $$unsubscribe_modalAction = subscribe(modalAction, (value) => $modalAction = value);
  let { active = "true" } = $$props;
  let { animation = "scale" } = $$props;
  let { animProps = { start: 1.2 } } = $$props;
  let { size = "200px" } = $$props;
  let { onBody = true } = $$props;
  function confirm() {
    set_store_value(modalResult, $modalResult = "confirmed", $modalResult);
    set_store_value(modalContent, $modalContent = "", $modalContent);
    set_store_value(modalActive, $modalActive = false, $modalActive);
  }
  function cancel() {
    set_store_value(modalAction, $modalAction = "", $modalAction);
    set_store_value(modalResult, $modalResult = "cancel", $modalResult);
    set_store_value(modalContent, $modalContent = "", $modalContent);
    set_store_value(modalActive, $modalActive = false, $modalActive);
  }
  if ($$props.active === void 0 && $$bindings.active && active !== void 0)
    $$bindings.active(active);
  if ($$props.animation === void 0 && $$bindings.animation && animation !== void 0)
    $$bindings.animation(animation);
  if ($$props.animProps === void 0 && $$bindings.animProps && animProps !== void 0)
    $$bindings.animProps(animProps);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0)
    $$bindings.size(size);
  if ($$props.onBody === void 0 && $$bindings.onBody && onBody !== void 0)
    $$bindings.onBody(onBody);
  if ($$props.confirm === void 0 && $$bindings.confirm && confirm !== void 0)
    $$bindings.confirm(confirm);
  if ($$props.cancel === void 0 && $$bindings.cancel && cancel !== void 0)
    $$bindings.cancel(cancel);
  $$unsubscribe_modalActive();
  $$unsubscribe_modalContent();
  $$unsubscribe_modalResult();
  $$unsubscribe_modalAction();
  return `





<div>${$modalActive ? `<div class="${"fixed inset-0 z-10 overflow-y-auto"}"><div class="${"h-10 my-6"}">
				
				<div class="${"modal-content"}">
					${slots.default ? slots.default({}) : ``}
					<div class="${"sub-component"}"></div></div>
</div></div>

		<div class="${"relative z-10"}" aria-labelledby="${"modal-title"}" role="${"dialog"}" aria-modal="${"true"}">
			<div class="${"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"}"></div>

			<div class="${"fixed inset-0 z-10 overflow-y-auto"}"><div class="${"flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"}">
					<div class="${"relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"}"><div class="${"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4"}"><div class="${"sm:flex sm:items-start"}"><div class="${"mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"}">
									<svg class="${"h-6 w-6 text-red-600"}" xmlns="${"http://www.w3.org/2000/svg"}" fill="${"none"}" viewBox="${"0 0 24 24"}" stroke-width="${"1.5"}" stroke="${"currentColor"}" aria-hidden="${"true"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" d="${"M12 10.5v3.75m-9.303 3.376C1.83 19.126 2.914 21 4.645 21h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 4.88c-.866-1.501-3.032-1.501-3.898 0L2.697 17.626zM12 17.25h.007v.008H12v-.008z"}"></path></svg></div>
								<div class="${"mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left"}"><h3 class="${"text-lg font-medium leading-6 text-gray-900"}" id="${"modal-title"}">Bevestig uw keuze
									</h3>
									<div class="${"mt-8"}"><p class="${"text-sm text-gray-500"}">${escape($modalContent)}</p></div></div></div></div>
						<div class="${"container py-1 px-1 mx-1 min-w-full grid place-items-center"}"><div class="${"flex items-center bg-gray-50 px-4 py-3 sm:flex sm:px-6"}">${validate_component(Button, "Button").$$render($$result, { class: "items-center" }, {}, {
    default: () => {
      return `Ja`;
    }
  })}
							${validate_component(Button, "Button").$$render($$result, {}, {}, {
    default: () => {
      return `Nee`;
    }
  })}</div></div></div></div></div></div>` : ``}</div>`;
});
const Nmcli_general = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $connectionStatus, $$unsubscribe_connectionStatus;
  let $modalContent, $$unsubscribe_modalContent;
  let $modalAction, $$unsubscribe_modalAction;
  $$unsubscribe_connectionStatus = subscribe(connectionStatus, (value) => $connectionStatus = value);
  $$unsubscribe_modalContent = subscribe(modalContent, (value) => $modalContent = value);
  $$unsubscribe_modalAction = subscribe(modalAction, (value) => $modalAction = value);
  {
    {
      switch ($modalAction) {
        case "reboot":
          postReboot$1();
          set_store_value(modalAction, $modalAction = "", $modalAction);
          set_store_value(modalContent, $modalContent = "", $modalContent);
      }
    }
  }
  {
    {
      if ($connectionStatus == "is-success") {
        notifications.info("U bent verbonden met de sensorkit", 3e3);
      } else if ($connectionStatus == "is-danger") {
        notifications.danger("U bent NIET verbonden met de sensorkit", 3e3);
      }
      if ($connectionStatus == "is-busy") {
        notifications.danger("Er wordt omgeschakeld ... ", 3e3);
      }
    }
  }
  $$unsubscribe_connectionStatus();
  $$unsubscribe_modalContent();
  $$unsubscribe_modalAction();
  return `

${validate_component(Modal, "Modal").$$render($$result, {}, {}, {
    default: () => {
      return `${escape($modalContent)}`;
    }
  })}

`;
});
const parseNumber = parseFloat;
function joinCss(obj, separator = ";") {
  let texts;
  if (Array.isArray(obj)) {
    texts = obj.filter((text) => text);
  } else {
    texts = [];
    for (const prop in obj) {
      if (obj[prop]) {
        texts.push(`${prop}:${obj[prop]}`);
      }
    }
  }
  return texts.join(separator);
}
function getStyles(style, size, pull, fw) {
  let float;
  let width;
  const height = "1em";
  let lineHeight;
  let fontSize;
  let textAlign;
  let verticalAlign = "-.125em";
  const overflow = "visible";
  if (fw) {
    textAlign = "center";
    width = "1.25em";
  }
  if (pull) {
    float = pull;
  }
  if (size) {
    if (size == "lg") {
      fontSize = "1.33333em";
      lineHeight = ".75em";
      verticalAlign = "-.225em";
    } else if (size == "xs") {
      fontSize = ".75em";
    } else if (size == "sm") {
      fontSize = ".875em";
    } else {
      fontSize = size.replace("x", "em");
    }
  }
  return joinCss([
    joinCss({
      float,
      width,
      height,
      "line-height": lineHeight,
      "font-size": fontSize,
      "text-align": textAlign,
      "vertical-align": verticalAlign,
      "transform-origin": "center",
      overflow
    }),
    style
  ]);
}
function getTransform(scale, translateX, translateY, rotate, flip, translateTimes = 1, translateUnit = "", rotateUnit = "") {
  let flipX = 1;
  let flipY = 1;
  if (flip) {
    if (flip == "horizontal") {
      flipX = -1;
    } else if (flip == "vertical") {
      flipY = -1;
    } else {
      flipX = flipY = -1;
    }
  }
  return joinCss(
    [
      `translate(${parseNumber(translateX) * translateTimes}${translateUnit},${parseNumber(translateY) * translateTimes}${translateUnit})`,
      `scale(${flipX * parseNumber(scale)},${flipY * parseNumber(scale)})`,
      rotate && `rotate(${rotate}${rotateUnit})`
    ],
    " "
  );
}
const css$1 = {
  code: ".spin.svelte-1cj2gr0{animation:svelte-1cj2gr0-spin 2s 0s infinite linear}.pulse.svelte-1cj2gr0{animation:svelte-1cj2gr0-spin 1s infinite steps(8)}@keyframes svelte-1cj2gr0-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}",
  map: null
};
const Fa = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { class: clazz = "" } = $$props;
  let { id = "" } = $$props;
  let { style = "" } = $$props;
  let { icon } = $$props;
  let { size = "" } = $$props;
  let { color = "" } = $$props;
  let { fw = false } = $$props;
  let { pull = "" } = $$props;
  let { scale = 1 } = $$props;
  let { translateX = 0 } = $$props;
  let { translateY = 0 } = $$props;
  let { rotate = "" } = $$props;
  let { flip = false } = $$props;
  let { spin = false } = $$props;
  let { pulse = false } = $$props;
  let { primaryColor = "" } = $$props;
  let { secondaryColor = "" } = $$props;
  let { primaryOpacity = 1 } = $$props;
  let { secondaryOpacity = 0.4 } = $$props;
  let { swapOpacity = false } = $$props;
  let i;
  let s;
  let transform;
  if ($$props.class === void 0 && $$bindings.class && clazz !== void 0)
    $$bindings.class(clazz);
  if ($$props.id === void 0 && $$bindings.id && id !== void 0)
    $$bindings.id(id);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  if ($$props.icon === void 0 && $$bindings.icon && icon !== void 0)
    $$bindings.icon(icon);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0)
    $$bindings.size(size);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0)
    $$bindings.color(color);
  if ($$props.fw === void 0 && $$bindings.fw && fw !== void 0)
    $$bindings.fw(fw);
  if ($$props.pull === void 0 && $$bindings.pull && pull !== void 0)
    $$bindings.pull(pull);
  if ($$props.scale === void 0 && $$bindings.scale && scale !== void 0)
    $$bindings.scale(scale);
  if ($$props.translateX === void 0 && $$bindings.translateX && translateX !== void 0)
    $$bindings.translateX(translateX);
  if ($$props.translateY === void 0 && $$bindings.translateY && translateY !== void 0)
    $$bindings.translateY(translateY);
  if ($$props.rotate === void 0 && $$bindings.rotate && rotate !== void 0)
    $$bindings.rotate(rotate);
  if ($$props.flip === void 0 && $$bindings.flip && flip !== void 0)
    $$bindings.flip(flip);
  if ($$props.spin === void 0 && $$bindings.spin && spin !== void 0)
    $$bindings.spin(spin);
  if ($$props.pulse === void 0 && $$bindings.pulse && pulse !== void 0)
    $$bindings.pulse(pulse);
  if ($$props.primaryColor === void 0 && $$bindings.primaryColor && primaryColor !== void 0)
    $$bindings.primaryColor(primaryColor);
  if ($$props.secondaryColor === void 0 && $$bindings.secondaryColor && secondaryColor !== void 0)
    $$bindings.secondaryColor(secondaryColor);
  if ($$props.primaryOpacity === void 0 && $$bindings.primaryOpacity && primaryOpacity !== void 0)
    $$bindings.primaryOpacity(primaryOpacity);
  if ($$props.secondaryOpacity === void 0 && $$bindings.secondaryOpacity && secondaryOpacity !== void 0)
    $$bindings.secondaryOpacity(secondaryOpacity);
  if ($$props.swapOpacity === void 0 && $$bindings.swapOpacity && swapOpacity !== void 0)
    $$bindings.swapOpacity(swapOpacity);
  $$result.css.add(css$1);
  i = icon && icon.icon || [0, 0, "", [], ""];
  s = getStyles(style, size, pull, fw);
  transform = getTransform(scale, translateX, translateY, rotate, flip, 512);
  return `${i[4] ? `<svg${add_attribute("id", id || void 0, 0)} class="${[
    "svelte-fa " + escape(clazz, true) + " svelte-1cj2gr0",
    (pulse ? "pulse" : "") + " " + (spin ? "spin" : "")
  ].join(" ").trim()}"${add_attribute("style", s, 0)} viewBox="${"0 0 " + escape(i[0], true) + " " + escape(i[1], true)}" aria-hidden="${"true"}" role="${"img"}" xmlns="${"http://www.w3.org/2000/svg"}"><g transform="${"translate(" + escape(i[0] / 2, true) + " " + escape(i[1] / 2, true) + ")"}" transform-origin="${escape(i[0] / 4, true) + " 0"}"><g${add_attribute("transform", transform, 0)}>${typeof i[4] == "string" ? `<path${add_attribute("d", i[4], 0)}${add_attribute("fill", color || primaryColor || "currentColor", 0)} transform="${"translate(" + escape(i[0] / -2, true) + " " + escape(i[1] / -2, true) + ")"}"></path>` : `
          <path${add_attribute("d", i[4][0], 0)}${add_attribute("fill", secondaryColor || color || "currentColor", 0)}${add_attribute("fill-opacity", swapOpacity != false ? primaryOpacity : secondaryOpacity, 0)} transform="${"translate(" + escape(i[0] / -2, true) + " " + escape(i[1] / -2, true) + ")"}"></path>
          <path${add_attribute("d", i[4][1], 0)}${add_attribute("fill", primaryColor || color || "currentColor", 0)}${add_attribute("fill-opacity", swapOpacity != false ? secondaryOpacity : primaryOpacity, 0)} transform="${"translate(" + escape(i[0] / -2, true) + " " + escape(i[1] / -2, true) + ")"}"></path>`}</g></g></svg>` : ``}`;
});
const Icon = Fa;
const css = {
  code: ".form-floating.svelte-ccd1tf.svelte-ccd1tf.svelte-ccd1tf{position:relative}.form-floating.svelte-ccd1tf>.form-control.svelte-ccd1tf.svelte-ccd1tf:not(:placeholder-shown){padding-top:1.625rem;padding-bottom:0.625rem}.form-floating.svelte-ccd1tf>.form-control.svelte-ccd1tf.svelte-ccd1tf{height:calc(3.5rem + 2px);line-height:1.25;padding:1rem 0.75rem}.form-floating.svelte-ccd1tf>.form-control.svelte-ccd1tf:not(:placeholder-shown)~label.svelte-ccd1tf{opacity:0.65;transform:scale(0.85) translateY(-0.5rem) translateX(0.15rem)}.form-floating.svelte-ccd1tf>label.svelte-ccd1tf.svelte-ccd1tf{position:absolute;top:0;left:0;height:100%;padding:1rem 0.75rem;pointer-events:none;border:1px solid transparent;transform-origin:0 0;transition:opacity 0.1s ease-in-out, transform 0.1s ease-in-out}",
  map: null
};
const Nmcli_connection_show = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $connectionStatus, $$unsubscribe_connectionStatus;
  let $modalResult, $$unsubscribe_modalResult;
  let $modalAction, $$unsubscribe_modalAction;
  let $modalParam, $$unsubscribe_modalParam;
  $$unsubscribe_connectionStatus = subscribe(connectionStatus, (value) => $connectionStatus = value);
  $$unsubscribe_modalResult = subscribe(modalResult, (value) => $modalResult = value);
  $$unsubscribe_modalAction = subscribe(modalAction, (value) => $modalAction = value);
  $$unsubscribe_modalParam = subscribe(modalParam, (value) => $modalParam = value);
  let iconFaWindowClose = faWindowClose;
  let iconFaWifi = faWifi;
  let iconFaCheck = faCheck;
  let connectModalActive = false;
  let unit = { nmcliConnections: [] };
  let wifiListArray = [];
  let wifiManualConnection = { ssid: "", password: "" };
  var isConnectingAP = "";
  var isRefreshingConnections = "is-not-loading";
  const nmcliConnectionShow = function() {
    isRefreshingConnections = "is-loading";
    getNmcliConnectionShow().then((response) => response.json()).then((result) => {
      if (Array.isArray(result) == true)
        unit.nmcliConnections = result;
      else
        unit.nmcliConnections = [];
      isRefreshingConnections = "is-not-loading";
    }).catch((error) => {
      console.log(error.message);
      unit.nmcliConnections = [];
      isRefreshingConnections = "is-not-loading";
    });
  };
  const nmcliConnectionDelete = function(connection) {
    deleteNmcliConnection(connection).then((result) => {
      nmcliConnectionShow();
    }).catch((error) => {
      console.log(error.message);
    });
  };
  const nmcliDeviceHotspot = async function() {
    const res = await getNmcliDeviceHotspot();
    if (res.error) {
      console.log(res.error.message);
    }
    console.log("end of activation device hotspot function");
  };
  const nmcliDeviceConnect = async function(connection) {
    await postNmcliDeviceConnect(connection).then((result) => {
      set_store_value(connectionStatus, $connectionStatus = "is-busy", $connectionStatus);
      nmcliConnectionShow();
    }).catch((error) => {
      console.log(error.message);
    });
  };
  const nmcliAddWifiNetwork = function(param) {
    isConnectingAP = "is-loading";
    postNmcliAddWifiNetwork(param).then((result) => {
      console.log("response status: " + result.status);
      isConnectingAP = "";
      notifications.info("Info: Wifi network is geconfigureerd", 3e3);
      nmcliConnectionShow();
    }).catch((error) => {
      isConnectingAP = "";
      notifications.danger("ERROR: Wifi network not configured, " + error.message, 3e3);
      console.log(error.message);
    });
  };
  const deleteConnection = (connection) => {
    nmcliConnectionDelete(connection);
  };
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    {
      {
        if ($modalResult != "") {
          if ($modalAction == "deleteConnection") {
            if ($modalResult == "confirmed") {
              set_store_value(modalParam, $modalParam.connection.key = $modalParam.key, $modalParam);
              deleteConnection($modalParam.connection);
            }
          }
          if ($modalAction == "addWifiNetwork") {
            if ($modalResult == "confirmed") {
              nmcliAddWifiNetwork($modalParam);
            }
          }
          if ($modalAction == "deviceConnect") {
            if ($modalResult == "confirmed") {
              set_store_value(modalParam, $modalParam.connection.key = $modalParam.key, $modalParam);
              nmcliDeviceConnect($modalParam.connection);
            }
          }
          if ($modalAction == "nmcliDeviceHotspot") {
            if ($modalResult == "confirmed") {
              nmcliDeviceHotspot();
            }
          }
        }
      }
    }
    $$rendered = `<div class="${"flex min-h-full items-center justify-center py-12"}">
	
	<div class="${"mt-2 space-y-6 items-center"}"><h1 class="${"text-center text-3xl font-bold mt-0 mb-6"}">Configureren Wifi-netwerk</h1>
		<div class="${"info-blok"}"><span>De onderstaande lijst laat de geconfigureerde Wifi-netwerken zien. Uw netwerk voegt u toe
				bij &quot;Wifi-netwerk toevoegen&quot;. Met het WiFi-symbool een netwerk te activeren.
				<br><br>
				${validate_component(Icon, "Icon").$$render(
      $$result,
      {
        class: "inline ml-4 mr-1",
        icon: iconFaWifi
      },
      {},
      {}
    )} = Activeer dit Wifi-netwerk<br>
				${validate_component(Icon, "Icon").$$render(
      $$result,
      {
        class: "inline ml-4 mr-2",
        icon: iconFaWindowClose
      },
      {},
      {}
    )} = Verwijder uit de configuratie<br>
				${validate_component(Icon, "Icon").$$render(
      $$result,
      {
        class: "inline ml-4 mr-2",
        icon: iconFaCheck
      },
      {},
      {}
    )} = Wifi-netwerk is actief</span></div>
		
		<div class="${"grid place-items-center"}">${unit.nmcliConnections != void 0 ? `${unit.nmcliConnections.error != void 0 ? `<div class="${"general error"}">ERROR: ${escape(unit.nmcliConnections.error.message)}</div>` : `<div class="${""}"><div class="${"overflow-x-auto sm:-mx-6 lg:-mx-8"}"><div class="${"py-2 inline-block min-w-full sm:px-6 lg:px-8"}"><div class="${"overflow-x-auto"}"><table class="${"border content-center"}"><thead class="${"border-b bg-gray-200"}"><tr><th scope="${"col"}" colspan="${"2"}" class="${"text-base font-semibold text-gray-900 px-4 py-4 text-left"}">Geconfigureerde Wifi netwerken
												</th>
												<th scope="${"col"}" class="${"text-sm font-medium text-gray-900 px-1 py-2 text-left"}"></th></tr></thead>
										<tbody>${each(unit.nmcliConnections, (connection, i) => {
      return `${connection.TYPE == "wifi" ? `<tr class="${"border-b bg-white"}"><td class="${"break-all px-6 py-4 text-gray-900"}">${escape(connection.NAME)}</td>
														<td class="${""}"><div class="${"inline-flex"}"><span class="${"inline-flex"}" aria-label="${"Open"}">${connection.DEVICE == "--" ? `${validate_component(Icon, "Icon").$$render(
        $$result,
        {
          style: "font-size: 2em; color: #3298dc;",
          class: "ml-0",
          icon: iconFaWifi
        },
        {},
        {}
      )}` : ``}</span>
																${connection.DEVICE != "--" ? `${validate_component(Icon, "Icon").$$render(
        $$result,
        {
          style: "font-size: 3em; color: #3298dc;",
          class: "ml-0",
          icon: iconFaCheck
        },
        {},
        {}
      )}` : ``}
															</div></td>
														<td class="${"text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap"}"><div><span style="${"font-size: 3em; color: red;"}" aria-label="${"Delete"}">${validate_component(Icon, "Icon").$$render($$result, { class: "ml-0", icon: iconFaWindowClose }, {}, {})}</span>
															</div></td>
													</tr>` : ``}`;
    })}
                      <tr class="${"border-b"}"><td></td></tr>
											<tr class="${"border-b bg-gray-200"}"><td class="${"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"}"></td>
												<td colspan="${"2"}" class="${"text-sm text-gray-900 font-light px-6 pb-2 "}">${validate_component(Button, "Button").$$render(
      $$result,
      {
        isRefreshingConnections,
        status: "is-default",
        class: "button is-info " + isRefreshingConnections
      },
      {},
      {
        default: () => {
          return `Ververs`;
        }
      }
    )}</td></tr></tbody></table></div></div></div></div>`}` : ``}</div></div></div>


<div class="${"container"}"><h1 class="${"text-center text-3xl font-bold mt-6 mb-6"}">Wifi-netwerk toevoegen</h1>
	
	<div class="${"info-blok"}"><span>Geef hier de naam en wachtwoord van uw thuis Wifi-netwerk om deze toe te voegen aan de
			configuratie van de sensorkit. De naam van het netwerk is ook te selecteren uit de lijst met
			Wifi-netwerken.
		</span></div>

	<div>

		<div class="${"flex justify-center mt-6"}"><div><div class="${"form-floating mb-3 xl:w-96 svelte-ccd1tf"}"><input type="${"text"}" class="${"form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none svelte-ccd1tf"}" id="${"ssid"}" autocapitalize="${"off"}" placeholder="${"Wifi netwerknaam"}"${add_attribute("value", wifiManualConnection.ssid, 0)}>
					<label for="${"ssid"}" class="${"text-gray-700 svelte-ccd1tf"}">Wifi netwerknaam</label></div>
				<div class="${"form-floating mb-3 xl:w-96 svelte-ccd1tf"}"><input type="${"password"}" class="${"form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none svelte-ccd1tf"}" id="${"password"}" autocapitalize="${"off"}" placeholder="${"Wifi wachtwoord"}"${add_attribute("value", wifiManualConnection.password, 0)}>
					<label for="${"password"}" class="${"text-gray-700 svelte-ccd1tf"}">Wifi wachtwoord</label></div></div></div>
		<div class="${"flex justify-center"}"><div class="${"mb-5 mt-0 xl:w-96"}">${validate_component(Button, "Button").$$render(
      $$result,
      {
        name: "manualm2",
        class: "plusbutton button is-info " + isConnectingAP,
        "aria-label": "Add connection"
      },
      {},
      {
        default: () => {
          return `Toevoegen
				`;
        }
      }
    )}</div></div>
		</div>

	<div class="${"grid place-items-center"}"><div class="${"flex flex-col"}"><div class="${"overflow-x-auto sm:-mx-6 lg:-mx-8"}"><div class="${"py-2 inline-block min-w-full sm:px-4 lg:px-8"}"><div class="${"overflow-x-auto"}"><table class="${"min-w-full table-fixed border is-striped text-center mb-20"}"><thead class="${"border-b bg-gray-200"}"><tr class="${""}"><th colspan="${"4"}" scope="${"col"}" class="${"max-w-sm font-bold font-medium text-gray-900 px-4 py-4 "}">Selecteer netwerknaam uit de lijst
                  </th></tr>
								<tr><th scope="${"col"}" class="${"max-w-sm text-sm text-left font-medium text-gray-900 px-6 py-4 "}"><div class="${"max-w-sm"}">Netwerknaam</div></th>
									<th scope="${"col"}" class="${"text-sm font-medium text-gray-900 px-1 py-2 text-right"}">Kanaal
									</th>
									<th scope="${"col"}" class="${"text-sm font-medium text-gray-900 px-1 py-2 text-right"}">Signaal
									</th>
									<th scope="${"col"}" class="${"text-sm font-medium text-gray-900 px-1 py-2 text-left"}"></th></tr></thead>
							<tbody class="${"bg-white"}">${each(wifiListArray, (accessPoint, i) => {
      return `${accessPoint.CHAN < 14e3 ? `${accessPoint.SSID != "--" ? `<tr class="${"border-b"}"><td class="${"break-all text-left"}"><div class="${"ml-4 mr-0"}">${escape(accessPoint.SSID)}</div></td>
												
												<td class="${"ml-0 text-right"}">${escape(accessPoint.CHAN)}</td>
												<td class="${"ml-0 text-right"}">${escape(accessPoint.SIGNAL)}</td>
												<td><div class="${"mx-2"}">${validate_component(Button, "Button").$$render(
        $$result,
        {
          name: "manualm2",
          cstatus: isConnectingAP
        },
        {},
        {
          default: () => {
            return `Selecteer
														`;
          }
        }
      )}
													</div></td>
											</tr>` : ``}` : ``}`;
    })}
                <tr class="${"border-b"}"><td></td></tr>
								<tr class="${"border-b bg-gray-200"}"><td class="${"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"}"></td>
									
									
									<td colspan="${"3"}" class="${"text-sm text-gray-900 font-light px-4 py-4 whitespace-nowrap"}"><div class="${"mx-8"}">
											${validate_component(Button, "Button").$$render($$result, { class: "px-1", status: "is-default" }, {}, {
      default: () => {
        return `Toon lijst`;
      }
    })}
											</div></td></tr></tbody></table></div></div></div></div></div></div>

${validate_component(Modal, "Modal").$$render(
      $$result,
      { active: connectModalActive },
      {
        active: ($$value) => {
          connectModalActive = $$value;
          $$settled = false;
        }
      },
      {}
    )}



`;
  } while (!$$settled);
  $$unsubscribe_connectionStatus();
  $$unsubscribe_modalResult();
  $$unsubscribe_modalAction();
  $$unsubscribe_modalParam();
  return $$rendered;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $modalContent, $$unsubscribe_modalContent;
  let $modalAction, $$unsubscribe_modalAction;
  $$unsubscribe_modalContent = subscribe(modalContent, (value) => $modalContent = value);
  $$unsubscribe_modalAction = subscribe(modalAction, (value) => $modalAction = value);
  {
    {
      switch ($modalAction) {
        case "reboot":
          postReboot();
          set_store_value(modalAction, $modalAction = "", $modalAction);
          set_store_value(modalContent, $modalContent = "", $modalContent);
      }
    }
  }
  $$unsubscribe_modalContent();
  $$unsubscribe_modalAction();
  return `
	<main><div class="${"mx-6 max-w-screen-sm"}"><h1 class="${"text-center text-5xl font-bold mt-20 mb-2"}">ApriSensor</h1>
		${validate_component(Nmcli_general, "NmcliGeneral").$$render($$result, {}, {}, {})}
		${validate_component(Nmcli_connection_show, "NmcliConnectionShow").$$render($$result, {}, {}, {})}</div></main>



`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-3029c866.js.map
