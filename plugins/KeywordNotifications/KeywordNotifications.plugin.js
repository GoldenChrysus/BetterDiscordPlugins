/**
 * @name KeywordNotifications
 * @donate https://paypal.me/goldenchrysus
 * @patreon https://www.patreon.com/Chrysus
 * @website https://github.com/GoldenChrysus
 * @source https://raw.githubusercontent.com/GoldenChrysus/BetterDiscordPlugins/main/plugins/KeywordNotifications/KeywordNotifications.plugin.js
 * @updateUrl https://raw.githubusercontent.com/GoldenChrysus/BetterDiscordPlugins/main/plugins/KeywordNotifications/KeywordNotifications.plugin.js
 */

 const request = require("request");
 const fs      = require("fs");
 const path    = require("path");
 
 const config = {
	info: {
		name    : "KeywordNotifications",
		authors : [
			{
				name: "GoldenChrysus"
			}
		],
		version     : "0.0.4",
		description : "Displays notifications when certain keywords are mentioned in messages.",
		github_raw  : "https://raw.githubusercontent.com/GoldenChrysus/BetterDiscordPlugins/main/plugins/KeywordNotifications/KeywordNotifications.plugin.js"
	},
	defaultConfig : [
		{
			type  : "textbox",
			name  : "Keywords (comma-separated)",
			note  : "",
			id    : "keywords",
			value : ""
		},
	]
 };
 
 module.exports = (!global.ZeresPluginLibrary)
	?
		class {
			constructor() {
				this._config = config;
			}
 
			load() {
				BdApi.showConfirmationModal(
					"Library plugin is needed",
					`The library plugin needed for KeywordNotifications is missing. Please click "Download" to install it.`,
					{
						confirmText : "Download",
						cancelText  : "Cancel",
						onConfirm   : () => {
							request.get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", (error, response, body) => {
								if (error) {
									return electron.shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
								}
	
								fs.writeFileSync(path.join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body);
							});
						}
					}
				);
			}
 
			start() {}
 
			stop() {}
		}
	:
		(
			([Plugin, Library]) => {
				const { DiscordAPI, DiscordModules, WebpackModules, PluginUtilities, Settings } = Library;
				const { React, ReactDOM, Dispatcher, NavigationUtils, UserStore } = DiscordModules;
 
				const classes = {
					...WebpackModules.getByProps("horizontal", "flex", "justifyStart"),
					...WebpackModules.getByProps("avatar", "alt")
				}
				const Spring  = WebpackModules.getByProps("useSpring");
 
				const {useSpring, animated} = Spring;
 
				const createStore = state => {
					const listeners = new Set();
					const api       = {
						getState(collector) {
							return (collector) ? collector(state) : state;
						},
 
						setState(partial) {
							const partialState = (typeof partial === "function") ? partial(state) : partial;
 
							state = Object.assign({}, state, partialState);
 
							listeners.forEach(listener => {
								listener(state);
							});
						},
 
						get listeners() {
							return listeners;
						},
 
						on(listener) {
							if (listeners.has(listener)) {
								return;
							}
 
							listeners.add(listener);
						
							return () => listeners.delete(listener);
						},
 
						off(listener) {
							return listeners.delete(listener);
						}
					};
				
					function useState(collector) {
						collector = typeof collector === "function" ? collector : e => e;
						const forceUpdate = React.useReducer(e => e + 1, 0)[1];

						React.useEffect(() => {
							const handler = () => forceUpdate();
						
							listeners.add(handler);
						
							return () => listeners.delete(handler);
						}, []);
					
						return collector(api.getState());
					}
				
					return [useState, api];
				}
 
				const {useEffect, useState} = React;
				const [useStore, api]       = createStore({toasts: []});
 
				const QWERTLib = new class {
					Toasts = {
						_api: api,
 
						get RunningToasts() {
							return api.getState(e => e.toasts)
						},
 
						Toast: function Toast(props) {
							const {children = [], avatar, id, author, onClick = _ => {}, color, time = 3000, onManualClose} = props;
							const [readyToClose, setReadyToClose] = useState(false);
 
							useEffect(_ => {
								if (readyToClose) {
									api.setState(state => {
										const index = state.toasts.findIndex(e => e.id === id);
 
										if (index < 0) {
											return state;
										}
 
										state.toasts.splice(index, 1);
										return state;
									});
 
									if (props.onClose) {
										props.onClose();
									}
								}
							}, [readyToClose]);
							const spring = useSpring({
								from: {
									progress : 0,
									scale    : (readyToClose) ? 1 : 0
								},
								to: {
									progress : 100,
									scale    : (readyToClose) ? 0 : 1
								},
								onRest: _ => {
									setReadyToClose(true);
								},
								config: key => {
									let duration = (key === "scale") ? 100 : time;
 
									return {duration};
								},
							});
 
							return React.createElement(animated.div, {
								className: "qwert-toast",
								id: id,
								onMouseOver: _ => {
									spring.progress.pause();
								},
								onMouseOut: _ => {
									spring.progress.resume();
								},
								style: {
									scale: spring.scale.to(e => {
										return e;
									})
								},
								children: [
									avatar && React.createElement("div", {
										className : "qwert-toast-icon-container",
										children  : React.createElement("img", {src: avatar, className: "qwert-toast-icon"})
									}),
									React.createElement(
										"div",
										{
											onClick: function() {
												onClick(),
												setReadyToClose(true)
											}
										}, 
										author && React.createElement(
											"strong",
											{
												className: "qwert-toast-author",
											},
											author
										),
										React.createElement(
											"div",
											{
												className: `qwert-toast-text ${classes.flex} ${classes.horizontal} ${classes.noWrap} ${classes.justifyStart}`
											},
											children
										)
									),
									React.createElement(
										animated.div,
										{
											className: "qwert-toast-bar",
											style: {
												width      : spring.progress.to(e => `${e}%`),
												background : color ?? "rgb(67, 181, 129)"
											}
										}
									),
									React.createElement(
										"svg",
										{
											className: "qwert-toast-close", 
											width: "16", height: "16", 
											viewBox: "0 0 24 24", 
											onClick: function() {
												onManualClose();
												setReadyToClose(true);
											}, 
										},
										React.createElement(
											"path",
											{
												d: "M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z",
												fill: "currentColor"}
										)
									),
								]
							})
						},
 
						detroy(id) {
							const state = api.getState().toasts;
							const toast = state.find(e => e.id === id);
 
							if (!toast || !toast.ref.current) {
								return false;
							}
 
							toast.ref.current.close();
							state.toasts.splice(state.toasts.indexOf(toast), 1);
							api.setState({toasts});
						},
 
						create(children, props) {
							const id = QWERTLib.createUUID();
 
							api.setState(state => ({toasts: state.toasts.concat({children, ...props, id})}));
							return id;
						},
 
						initialize() {
							const DOMElement = document.createElement("div");
 
							DOMElement.className = "qwert-toasts";
 
							function QWERTToasts() {
								const toasts = useStore(s => s.toasts);
 
								return toasts.map(toast => React.createElement(QWERTLib.Toasts.Toast, {
									...toast,
									key: toast.id
								}));
							}
 
							ReactDOM.render(React.createElement(QWERTToasts, {}), DOMElement);

							if (document.querySelector(".qwert-toasts")) {
								return;
							}
 
							document.getElementById("app-mount").appendChild(DOMElement);
						},
						shutdown() {
							const DOMElement = document.getElementsByClassName("qwert-toasts")[0];
							ReactDOM.unmountComponentAtNode(DOMElement);
							DOMElement.remove();
						}
					}
 
					createUUID() {
						return 'xxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
							var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
 
							return v.toString(16);
						});
					}
				
					initialize() {
						this.Toasts.initialize();
					}
				
					shutdown() {
						this.Toasts.shutdown();
					}
				}
 
				class KeywordNotifications extends Plugin {
					constructor() {
						super();
					}
 
					onStart() {
						QWERTLib.initialize();
						Dispatcher.subscribe("MESSAGE_CREATE", this.onMessage.bind(this));
						PluginUtilities.addStyle("QWERTLib", `
							.qwert-toasts {
								position: absolute;
								right: 10px;
								left: 10px;
								right: 10px;
								top: 10px;
								justify-content: flex-start;
								align-items: flex-end;
								display: flex;
								flex-direction: column;
								pointer-events: none;
								z-index: 9999;
							}
							.qwert-toast {
								position: relative;
								display: -webkit-inline-box;
								pointer-events: all;
								align-items: center;
								min-height: 24px;
								backdrop-filter: blur(5px);
								border-radius: 3px;
								box-shadow: var(--elevation-medium);
								padding: 10px 12px 10px 10px;
								max-width: 50vw;
								opacity: 1;
								margin-top: 10px;
								color: white;
								background: rgba(10,10,10,0.5);
								overflow: hidden;
								cursor: pointer;
							}
							.qwert-toast-text {
								position: relative;
								display: block;
								max-width: 400px;
								flex: 1 0 auto;
								font-size: 14px;
								font-weight: 500;
								white-space: nowrap;
								word-wrap: break-word;
								overflow: hidden;
								text-overflow: ellipsis;         
							}
							.qwert-toast:hover .qwert-toast-text {
								display: block;
								white-space: break-spaces;
							}
							.qwert-toast-author {
								font-size: 14px;
								max-width: 400px;
								max-height: 24px;
								white-space: nowrap;
								word-wrap: break-word;
								text-overflow: ellipsis;
								margin-bottom: 2px;
							}
							.qwert-toast-bar {
								height: 3px;
								position: absolute;
								bottom: 0;
								left: 0;
							}
							.qwert-toast-icon {
								height: 22px;
								height: 22px;
								border-radius: 50%;
							}
							.qwert-toast-icon-container {
								padding-right: 5px;
								margin-top: 1px;
								top: 10px;
							}
							.qwert-toast-close {
								margin-left: 5px;
								cursor: pointer;
							}
						`);
					}
 
					getSettingsPanel() {
						let list        = [];
						let server_list = [];
 
						for (let guild of DiscordAPI.guilds) {
							const key = `server_${guild.id}`;
 
							server_list.push(new Settings.Switch(
								guild.name,
								"",
								(this.settings[key] || this.settings[key] === undefined) ? true : false,
								(enabled) => {
									this.settings[key] = enabled;
								}
							));
						}
 
						list.push(new Settings.Textbox(
							"keywords",
							"Notification keywords (comma-separated)",
							this.settings.keywords,
							(text) => {
								this.settings.keywords = text;
							}
						));
 
						let server_group = new Settings.SettingGroup(
							"servers",
							{
								collapsible : true
							}
						).append(...server_list);
 
						list.push(server_group);
 
						const panel = new Settings.SettingPanel(
							this.saveSettings.bind(this),
							...list
						);
 
						return panel.getElement();
					}
 
					onStop() {
						QWERTLib.shutdown();
						Dispatcher.unsubscribe("MESSAGE_CREATE", this.onMessage.bind(this));
					}

					escapeRegex(string) {
						return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
					}
 
					onMessage({ message }) {
						if (
							message.author.id === DiscordAPI.currentUser.id ||
							(DiscordAPI.currentChannel && message.channel_id === DiscordAPI.currentChannel.id)
						) {
							return;
						}
 
						if (!message.guild_id) {
							return;
						}
 
						if (this.settings[`server_${message.guild_id}`] === false) {
							return;
						}
 
						const content  = message.content.toLowerCase();
						const author   = UserStore.getUser(message.author.id);
						const keywords = this.settings.keywords.split(",");
 
						for (let keyword of keywords) {
							keyword = this.escapeRegex(keyword.toLowerCase().trim());

							if (keyword.length === 0) {
								continue;
							}

							let regex = new RegExp(`\\b${keyword}\\b`, "g");
 
							if (regex.test(content)) {
								if (DiscordAPI.currentUser.status !== "dnd") {
									Library.DiscordModules.SoundModule.playSound("message1");
								}

								QWERTLib.Toasts.create(
									`"${keyword}" mentioned: ${content}`,
									{
										avatar  : author.avatarURL,
										author  : author.tag,
										time    : 5000,
										onClick : () => {
											NavigationUtils.transitionToGuild(message.guild_id, message.channel_id, message.id);
										},
									}
								);
 
								return;
							}
						}
					}
				}
 
				return KeywordNotifications;
			}
		)(global.ZeresPluginLibrary.buildPlugin(config));
 