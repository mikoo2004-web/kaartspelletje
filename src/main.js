import { bindUi, render } from "./board.js?v=queen-ants-1";
import { resetGame } from "./gameState.js";
import { renderRulesPage } from "./rulesPage.js";
import { bindTestPanel } from "./testRunner.js";

bindUi();
bindTestPanel(render);
resetGame();
renderRulesPage();
render();






