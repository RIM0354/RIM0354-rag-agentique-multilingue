"""Calculs financiers faits par du code, jamais « de tête » par le LLM.

Le LLM extrait les chiffres cités dans les extraits et écrit une formule ;
ce module évalue la formule de façon sûre (aucun appel de fonction, aucun nom inconnu).
"""
import ast
import operator

_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.Pow: operator.pow, ast.USub: operator.neg, ast.UAdd: operator.pos,
}


def safe_eval(formula: str, variables: dict[str, float]) -> float:
    """Évalue une formule arithmétique comme '(rn / pnb) * 100' avec les variables fournies."""
    def ev(node: ast.AST) -> float:
        if isinstance(node, ast.Expression):
            return ev(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.Name):
            if node.id not in variables:
                raise ValueError(f"variable inconnue : {node.id}")
            return float(variables[node.id])
        if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](ev(node.left), ev(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](ev(node.operand))
        raise ValueError(f"élément non autorisé : {type(node).__name__}")

    return ev(ast.parse(formula, mode="eval"))


def run_calculations(calcs: list[dict], variables: dict[str, float]) -> list[dict]:
    """calcs = [{"label": "Marge nette 2023", "formula": "rn_2023 / pnb_2023 * 100", "unit": "%"}]"""
    results = []
    for calc in calcs:
        try:
            value = safe_eval(calc["formula"], variables)
            results.append({**calc, "value": round(value, 2)})
        except (ValueError, ZeroDivisionError, KeyError, SyntaxError) as exc:
            results.append({**calc, "error": str(exc)})
    return results
