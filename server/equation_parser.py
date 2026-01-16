"""
Equation Parser

Converts LaTeX mathematical expressions to Python/NumPy-compatible expressions
for plotting mathematical functions.

Supported expressions:
- Polynomials: x^2, x^3, 2x + 1
- Trigonometric: sin(x), cos(x), tan(x), etc.
- Exponential/Log: e^x, ln(x), log(x)
- Fractions: frac{a}{b}
- Square roots: sqrt{x}
- Constants: pi, e
"""

import re
from typing import Optional
import numpy as np


class EquationParseError(Exception):
    """Raised when LaTeX equation cannot be parsed."""
    pass


class EquationParser:
    """
    Parser to convert LaTeX expressions to Python/NumPy expressions.
    """
    
    # LaTeX to Python mappings
    FUNCTION_MAP = {
        r'\\sin': 'np.sin',
        r'\\cos': 'np.cos',
        r'\\tan': 'np.tan',
        r'\\cot': '(1/np.tan',  # Will need closing paren
        r'\\sec': '(1/np.cos',
        r'\\csc': '(1/np.sin',
        r'\\arcsin': 'np.arcsin',
        r'\\arccos': 'np.arccos',
        r'\\arctan': 'np.arctan',
        r'\\sinh': 'np.sinh',
        r'\\cosh': 'np.cosh',
        r'\\tanh': 'np.tanh',
        r'\\ln': 'np.log',
        r'\\log': 'np.log10',
        r'\\exp': 'np.exp',
        r'\\sqrt': 'np.sqrt',
        r'\\abs': 'np.abs',
    }
    
    CONSTANT_MAP = {
        r'\\pi': 'np.pi',
        r'\\e': 'np.e',
        r'\\infty': 'np.inf',
    }
    
    def __init__(self):
        pass
    
    def parse(self, latex: str) -> str:
        """
        Parse LaTeX expression to Python expression.
        
        Args:
            latex: LaTeX expression (e.g., "y = x^2" or "\\sin(x)")
            
        Returns:
            Python expression string (e.g., "x**2" or "np.sin(x)")
            
        Raises:
            EquationParseError: If parsing fails
        """
        if not latex or not latex.strip():
            raise EquationParseError("Empty equation")
        
        # Clean input
        expr = latex.strip()
        
        # Remove "y =" or "f(x) =" prefix if present
        expr = self._remove_lhs(expr)
        
        # Apply transformations
        expr = self._convert_latex_to_python(expr)
        
        # Validate the result
        self._validate_expression(expr)
        
        return expr
    
    def _remove_lhs(self, expr: str) -> str:
        """Remove left-hand side of equation (y=, f(x)=, etc.)"""
        # Pattern: y = ..., f(x) = ..., f( x ) = ...
        patterns = [
            r'^[yY]\s*=\s*',                    # y = 
            r'^[fFgGhH]\s*\([^)]*\)\s*=\s*',    # f(x) = 
            r'^[a-zA-Z]+\s*=\s*',               # anything = 
        ]
        
        for pattern in patterns:
            expr = re.sub(pattern, '', expr)
        
        return expr.strip()
    
    def _convert_latex_to_python(self, expr: str) -> str:
        """Apply all LaTeX to Python conversions."""
        
        # Step 1: Handle fractions \frac{a}{b} -> (a)/(b)
        expr = self._convert_fractions(expr)
        
        # Step 2: Handle powers with braces x^{2} -> x**(2)
        expr = re.sub(r'\^{([^}]+)}', r'**(\1)', expr)
        
        # Step 3: Handle simple powers x^2 -> x**2
        expr = re.sub(r'\^(\d+)', r'**\1', expr)
        expr = re.sub(r'\^([a-zA-Z])', r'**\1', expr)
        
        # Step 4: Handle square roots \sqrt{x} -> np.sqrt(x)
        expr = re.sub(r'\\sqrt{([^}]+)}', r'np.sqrt(\1)', expr)
        expr = re.sub(r'\\sqrt\s*(\w)', r'np.sqrt(\1)', expr)
        
        # Step 5: Handle nth roots \sqrt[n]{x} -> (x)**(1/n)
        expr = re.sub(r'\\sqrt\[([^\]]+)\]{([^}]+)}', r'((\2))**(1/(\1))', expr)
        
        # Step 6: Handle e^{...} -> np.exp(...)
        expr = re.sub(r'e\*\*\(([^)]+)\)', r'np.exp(\1)', expr)
        expr = re.sub(r'e\*\*(\w+)', r'np.exp(\1)', expr)
        
        # Step 7: Replace LaTeX functions
        for latex_func, py_func in self.FUNCTION_MAP.items():
            # Handle \func{arg} syntax
            pattern = latex_func + r'{([^}]+)}'
            if 'cot' in latex_func or 'sec' in latex_func or 'csc' in latex_func:
                # These need extra closing paren
                expr = re.sub(pattern, py_func + r'(\1))', expr)
            else:
                expr = re.sub(pattern, py_func + r'(\1)', expr)
            
            # Handle \func(arg) syntax
            pattern = latex_func + r'\(([^)]+)\)'
            if 'cot' in latex_func or 'sec' in latex_func or 'csc' in latex_func:
                expr = re.sub(pattern, py_func + r'(\1))', expr)
            else:
                expr = re.sub(pattern, py_func + r'(\1)', expr)
            
            # Handle \func arg syntax (space separated)
            pattern = latex_func + r'\s+([a-zA-Z0-9]+)'
            if 'cot' in latex_func or 'sec' in latex_func or 'csc' in latex_func:
                expr = re.sub(pattern, py_func + r'(\1))', expr)
            else:
                expr = re.sub(pattern, py_func + r'(\1)', expr)
        
        # Step 8: Replace constants
        for latex_const, py_const in self.CONSTANT_MAP.items():
            expr = re.sub(latex_const, py_const, expr)
        
        # Step 9: Handle implicit multiplication
        # 2x -> 2*x, xy -> x*y, 2(x+1) -> 2*(x+1), x(x+1) -> x*(x+1)
        expr = self._add_implicit_multiplication(expr)
        
        # Step 10: Clean up LaTeX commands that weren't handled
        expr = re.sub(r'\\[a-zA-Z]+', '', expr)
        
        # Step 11: Clean up spaces and braces
        expr = expr.replace('{', '(').replace('}', ')')
        expr = re.sub(r'\s+', '', expr)  # Remove whitespace
        
        # Step 12: Handle absolute value |x| -> np.abs(x)
        expr = re.sub(r'\|([^|]+)\|', r'np.abs(\1)', expr)
        
        return expr
    
    def _convert_fractions(self, expr: str) -> str:
        """Convert \\frac{a}{b} to (a)/(b)."""
        # Handle nested fractions by iterating
        max_iterations = 10
        for _ in range(max_iterations):
            # Match innermost \frac first
            match = re.search(r'\\frac{([^{}]+)}{([^{}]+)}', expr)
            if not match:
                break
            expr = expr[:match.start()] + f'(({match.group(1)})/({match.group(2)}))' + expr[match.end():]
        
        return expr
    
    def _add_implicit_multiplication(self, expr: str) -> str:
        """Add * for implicit multiplication."""
        result = expr
        
        # Number followed by letter: 2x -> 2*x
        result = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', result)
        
        # Letter followed by ( : x( -> x*(
        result = re.sub(r'([a-zA-Z])(\()', r'\1*\2', result)
        
        # ) followed by letter: )x -> )*x
        result = re.sub(r'(\))([a-zA-Z])', r'\1*\2', result)
        
        # ) followed by (: )( -> )*(
        result = re.sub(r'(\))(\()', r'\1*\2', result)
        
        # Number followed by (: 2( -> 2*(
        result = re.sub(r'(\d)(\()', r'\1*\2', result)
        
        # ) followed by number: )2 -> )*2
        result = re.sub(r'(\))(\d)', r'\1*\2', result)
        
        # Fix np.function patterns that got broken by implicit multiplication
        # np.log*(x) -> np.log(x), np.sin*(x) -> np.sin(x), etc.
        result = re.sub(r'(np\.[a-z]+)\*\(', r'\1(', result)
        
        return result
    
    def _validate_expression(self, expr: str) -> None:
        """Validate the Python expression is safe and valid."""
        # Check for dangerous patterns
        dangerous = ['import', 'exec', 'eval', 'open', 'file', '__', 'os.', 'sys.']
        for d in dangerous:
            if d in expr.lower():
                raise EquationParseError(f"Invalid expression: contains '{d}'")
        
        # Check balanced parentheses
        if expr.count('(') != expr.count(')'):
            raise EquationParseError("Unbalanced parentheses in expression")
        
        # Try to compile the expression
        try:
            compile(expr, '<string>', 'eval')
        except SyntaxError as e:
            raise EquationParseError(f"Invalid expression syntax: {e}")
    
    def create_function(self, expr: str):
        """
        Create a numpy-compatible function from Python expression.
        
        Args:
            expr: Python expression with 'x' as variable
            
        Returns:
            Callable that takes numpy array and returns numpy array
        """
        # Create safe namespace
        safe_namespace = {
            'np': np,
            'x': None,  # Will be replaced
            'pi': np.pi,
            'e': np.e,
        }
        
        def f(x_values):
            safe_namespace['x'] = x_values
            try:
                return eval(expr, {"__builtins__": {}}, safe_namespace)
            except Exception as e:
                # Return NaN for invalid values
                return np.full_like(x_values, np.nan, dtype=float)
        
        return f


# Convenience function
def parse_latex_equation(latex: str) -> str:
    """
    Parse LaTeX equation to Python expression.
    
    Args:
        latex: LaTeX expression
        
    Returns:
        Python/NumPy expression string
    """
    parser = EquationParser()
    return parser.parse(latex)


def create_plottable_function(latex: str):
    """
    Create a plottable function from LaTeX.
    
    Args:
        latex: LaTeX expression
        
    Returns:
        Callable that takes numpy array x and returns y values
    """
    parser = EquationParser()
    expr = parser.parse(latex)
    return parser.create_function(expr)
