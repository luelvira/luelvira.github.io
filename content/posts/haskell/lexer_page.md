+++
title = "The lexer"
author = ["Lucas Elvira Martín"]
date = 2024-07-11T00:00:00+02:00
lastmod = 2024-09-09T13:25:34+02:00
draft = false
weight = 1003
posts = "haskell"
+++

This is the first part of the parser. This module define the tokens and evaluate
if the string could be represent with a custom grammar.

<!--more-->

The tokens are defined as:

```haskell
-- | A list with the possible tokens readded from the programm
data Token
  = TokLeftParen
  | TokRightParen
  | TokEquals
  | TokDot
  | TokOperator Eq.Operation
  | TokNumber Value
  | TokEof -- End of File
  | TokEos -- End of Sentence
  | TokEol -- End Of Line
  | TokError
  deriving (Eq)
```

Some of these tokens will not be used at the moment, but could be used in future versions.

And the grammar is:

```haskell
@
S := Start symbol
A := add operation
B := {AT}
C := {MF}
F := Factor
M := mult operation
N := number
n := digit
T := term

S -> TB
S -> T
B -> AT
B -> ATB
T -> F
T -> FC
C -> MF
C -> MFC
N -> nN
N -> n
A -> + | -
M -> * | /
@
```

A more clear version of the grammar was done with data type

```haskell
-- | Addition operations (Sum or difference)
data Addop = Summ | Diff
-- | Multiplication operations (multiplication and division)
data Mulop = Mult | Divi
-- | Real number
newtype Value = RealValue Double deriving (Eq)

-- | Tuple with a Term and a list of possibles additional terms concatenate by an Addop
newtype Expression = Expression (Term, [(Addop, Term)]) deriving (Show)
-- | Tuple with a Factor and a list of possibles addition factors concatenate by an MulOp
newtype Term = Term (Factor, [MulOpFact]) deriving (Show, Eq)
-- | Factor and Value are equivalents
newtype Factor = Factor Value deriving (Show, Eq)
-- | Tuple with an Mulop and a Factor
type MulOpFact = (Mulop, Factor)
-- | Tuple with an Addop and a Term
```


## Tokens {#tokens}

The most reduce piece of the grammar is the factor, which is only a number. The
first function will tray to extract the number from the string and returns it
and the string remainder

```haskell
let (nextTerm, moreTerm) = case evalTerm rest of
                              Right right -> right
                              Left l -> throw l
    (restAddopTerm, restTerm) = case evalExpression' Nothing moreTerm of
                                  Right rat -> rat
```

Next, a term is composed by a `Factor` and a list of `(MulOp, factor)`. So, I split
the process in two functions.

The first one will be in charge of iter over the string and returns the full
list of tuples

```haskell
cleanString str = [x | x <- str, x /= ' ']

-- Expression
-- | The first rule should be transform the expression (the initial state) into
-- a <term> or a (<term>, (<addop> <term>)+)
expression :: String -> Either EvalError Expression
expression "" = Left EmptyExpression
expression xs = case evalTerm xs of
                  Left l -> Left l
                  Right (term, addopTerm) -> case evalExpression' Nothing addopTerm of
                                               Right (list, "") -> Right $ Expression (term, list)
                                               Right (_, _:_) -> Left InvalidExpression
                                               Left l -> throw l

-- | Given a list of AddopTerm and a String, read the string while the function returns
-- a new AddopTerm. Once the function can not continue, returns the list with the rest of the
```

With this auxiliary function, I can write the `evalTerm`

```haskell
-- | For each character, the function will run all the possibles rules defined
-- | in the grammar building a list of Tokens. The easiest way to do it, is with
-- | a DFS algorith
eval :: String -> Expression
eval str = case expression $ cleanString str of
             Left l -> throw l
```

Following the same approach, I write the last rule `expression`

```haskell
-- | For each character, the function will run all the possibles rules defined
-- | in the grammar building a list of Tokens. The easiest way to do it, is with
-- | a DFS algorith
eval :: String -> Expression
eval str = case expression $ cleanString str of
             Left l -> throw l
```
