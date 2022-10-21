import { Context } from '../resolveMessage';
import Component from './component';
import messageLogger from './messageLogger';
import help from './help';
import atBot from './atBot';
import updater from './updater';
import searchCharacter from './searchCharacter';
import wiki from './wiki';
import management from './management'
import { ArknightsPlugin } from '..';
import gacha from './gacha';

const components = [
  messageLogger,
  help,
  management,
  atBot,
  updater,
  searchCharacter,
  wiki,
  gacha,
];

const useComponents = (ctx: Context, plugin: ArknightsPlugin) => {
  for (const component of components) {
    const skipOther = component.run(ctx, plugin);
    if (skipOther) return;
  }
}
export default useComponents;

export { Component }
export const addCustomComponent = (c: Component) => {
  console.log('Add custom component [', c.name, ']')
  if (!components.includes(c)) components.push(c);
}
export const removeCustomComponent = (c: Component) => {
  if (components.includes(c)) components.splice(components.indexOf(c), 1);
}
