import {boot} from './runtime-live';
import {createBindingRuntime} from './bindings';
import {assertUIState} from './state';
boot(createBindingRuntime,assertUIState);
