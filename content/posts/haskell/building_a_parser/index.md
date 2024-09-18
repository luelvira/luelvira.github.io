+++
title = "Building a parser"
author = ["Lucas Elvira Martín"]
date = 2024-07-11T17:07:00+02:00
lastmod = 2024-09-18T13:39:58+02:00
tags = ["EXPORT", "PERMANENT", "TUTORIAL"]
draft = false
+++

## Write a lexical parser in Haskell {#write-a-lexical-parser-in-haskell}

Haskell is widely used in academic stages and for teaching the functional
programming paradigm. Consequently, there are numerous examples and
implementations in Haskell for building parsers.

In this tutorial, I will describe the process of writing a simple parser in
Haskell, with the dual purpose of learning Haskell and understanding how to
write a parser. My intent is not to teach others how to do this kind of project
in detail, as there are already many excellent tutorials and examples that I
followed. Instead, I aim to offer a different point of view, focused on
beginners in Haskell, like myself.

First of all, some concepts need to be understood before start writing.


### What a Parser is {#what-a-parser-is}

Parsers are software tools that read and analyze a stream of input and convert
it into syntax structures. The input could be a String or a list of symbols.
Parsers determine whether the input follows a Formal Grammar or not.


#### What a Formal Grammar is {#what-a-formal-grammar-is}

Formal Grammar describes which strings from an alphabet are part of the language
the grammar defines. A grammar is defined by a tuple with the alphabet (a set of
indivisible terms), the production rules, the initial state, and the set of
terminal states. They are represented as \\((V, T, S, P)\\) where:

-   \\(V\\) is a finite set of non-terminal symbols
-   \\(T\\) is a finite set of terminal symbols
-   \\(S\\) is the initial state. Because that, should accomplish \\(S \in V \cup S \in T\\)
-   \\(P\\) is a finite set of production rules, that \\(P\_i (V\_k) -> N\_j, N \in V \cup  T\\)
-   \\(V \cap T = \emptyset\\)

The production rules transform or substitute a Start symbol into another
sequence of symbols. If the grammar can produce a string, we say that this
string is part of the language, and it is valid. There exist different forms of
grammar representation, but I will focus on the [EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form).

-   A symbol is a variable, that always is enclosed by a pair &lt; &gt;
-   \\(::=\\) The symbol on the left should be replaced by the right part.
-   An expression is one or more sequences of symbols, where each sequence is separated by "|" which means _or_
-   \\(\\{\\) and \\(\\}\\) means zero or more
-   \\([\\) and \\(]\\) means zero or once

For example, a grammar that represents unsigned hexadecimal numbers can be
described as:

```nil
G = (V, T, S, P)
V = { <hexdigit>, <hexnumber>, <digit>, <alpha> }
T = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f' }
P = {
    S ::= <hexnumber>
    <hexnumber> ::= < hexnumber > <hexdigit >  | <hexdigit>
    <hexdigit> ::= <digit> | <alpha>
    <digit> ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    <alpha> ::= a | b | c | d | e | f
}
```

If you pay attention, you can see that the second production rule prefers to set
the terminal symbol on the right and transform the left symbol. This is a
special case of context-free grammar called left-linear. A grammar could be
either left-linear or right-linear, but not both.

Following the EBNF notation, the rule:

\\( <hexnumber> ::= <hexnumber> <hexdigit> | <hexdigit> \\) is equivalent to

\\(<hexnumber> ::= \\{<hexnumber>\\} <hexdigit>\\)

<!--list-separator-->

-  Types of production rules

    -   Sequence: a symbol is transformed into a sequence of symbols \\(S::= AB\\)
    -   Repetition: A symbol could appear zero or any times \\(S::= \\{A\\}B\\)
    -   Optional: A symbol could appear zero or one time \\(S::[A]B\\)


#### Abstract syntax tree {#abstract-syntax-tree}

If the input is valid, the parser returns an Abstract syntax tree (AST). An AST
is a tree representation of a sentence where each node can only be evaluated
after its children have been evaluated. This means that the tree is read bottom
up.

{{< figure src="AST-Example-2024-07-18-1709.png" >}}


## Let's practice! {#let-s-practice}


### Setup the project {#setup-the-project}

I use [cabal](https://www.haskell.org/cabal/) to manage the project, but [stack](https://docs.haskellstack.org/en/stable/) is also available. To initialize
the project, execute

```shell
mkdir dummy-calc
cabal init --interactive
```

The command will prompt you for some questions and create the folder structure
with a result similar to the following one. I changed the name of the test main
file from `Main.hs` to `Spec.hs` because I want to use _Spec_ test suit library.

```text
.
├── app
│   └── Main.hs
├── dummy-calc.cabal
├── CHANGELOG.md
├── LICENSE
├── src
│   └── DummyCalc.hs
└── test
    └── Spec.hs

4 directories, 6 files
```

In the file `dummy-calc.cabal` At the test-suit, on the test-suit, we should
append

```cabal
ghc-options:
  -O -threaded -rtsopts -with-rtsopts=-N
build-tool-depends:
  hspec-discover:hspec-discover
```


### Define the alphabet {#define-the-alphabet}

As mentioned before, grammars are defined by an alphabet and a set of production rules.
For the alphabet, I use a set of _TOKENS_. A token is the smallest unit of
information in the language that we are designing. At this point, our dummy calc
only recognizes the simplest math expression \\(+, -, \*, /\\) and parenthesis to
determine the priority of the operations. But, at some point, I want to allow
other operations such as assigning a value to a variable.

We will create a file, named `Tokens.hs` in the folder `src/DummyCalc/Lexer/` and
use a `Data` constructor to define them.

The `Data` keyword allows for defining new data structures. We are wrapping a set of
_newtype_ into a new `Data` type. So, when a function signature specifies the Data
type created, it could be any of the new types that are defined within it. You
can think of them as a combination of both, structs and enums. The `data`
declaration looks like:

```haskell
data <Type-Name> <type-args>
  = <Data-Constructor1> <types>
  = <Data-Constructor2> <types>
```

The advantages from the data declaration versus the newtype are:

1.  We can write many types in the `<types>` part, not only one.
2.  We can have alternative structures using the or operator `|`

Into the file `src/DummyCalc/Lexer/Tokens.hs` we can define the tokens as:

```haskell
-- | Token are the smallest semantically piece of information.
-- | Each constructor represent an abstraction of the readed text
-- | except TokOperator and TokNumber which need information about the values
-- | they represent
data Token
  = TokLeftParen -- ^ (
  | TokRightParen -- ^ )
  | TokEquals -- ^ =
  | TokOperator La.Operation -- ^ + | - | * | /
  | TokNumber La.NumValue -- ^ a number
  | TokVar La.Variable -- ^ a variable
  | TokEof -- ^ End Of File
  | TokEos -- ^ End of Sentence
  | TokError String-- ^ Error
  deriving (Eq)
```

In Haskell, we can extend a `custom type` with the properties of other classes.
For example, in the example above, We are extending, or deriving the class `Eq`
which offers the method `(==) a a`. This method returns `True` if both parameters
are equal. This means that our `Tokens` can be compared between them. If we need
more control over the method that the class provides, we can define an instance
of a type class manually.

```haskell
instance Show Token where
  show TokLeftParen  = "'('"
  show TokRightParen = "')'"
  show TokEquals     = "'='"
  show (TokOperator op) = show op
  show (TokNumber v) = "TN " <> (show v)
  show (TokVar v)    = show v
  show TokEof        = "EOF"
  show TokEos        = "EOS"
  show (TokError char) = "Unrecogniced token at " <> char
```

In this case, we are overwriting the `show` function. Now, when the program tries to
print any of the tokens, will evaluate our custom function.


### Lexical Analysis {#lexical-analysis}

Once we have defined all the data structures, we need to read an input and
convert it into these structures. This process is known as _lexical analysis_ and
can be defined as the process of reading a text and assembling it into a sequence
of _lexemes_ or _tokens_.

We can make a function that reads the string and returns a list of Token. This
function is written in the file `src/DummyCalc/Lexer.hs`

<a id="code-snippet--ex:lexer"></a>
```haskell
-- | Convert a string into a list of lexems
lexer :: String -> [Token]
lexer "" = []
lexer xs@(x:xs')
  | isSpace x = lexer xs'
  | x == '(' = TokLeftParen : lexer xs'
  | x == ')' = TokRightParen : lexer xs'
  | x == '=' = caseEquals xs'
  | x == ';' = caseIsEndOfFile xs' -- TokEos : lexer xs'
  | isDigit x = caseReadValue xs
  | isOpChar x = caseReadOperator xs
  | isValidAsFirstChar x = caseIsVariable xs
  | otherwise = TokError [x] : lexer xs'
```
<div class="src-block-caption">
  <span class="src-block-number"><a href="#code-snippet--ex:lexer">Code Snippet 1</a>:</span>
  lexer definition
</div>

This is a recursive function that reads character by character the input, and has contemplated the following case:

1.  Base Case. If the input is empty, the function returns an empty list.
2.  If the input is a space, the function returns the result of executing the function skipping this character.
3.  Prepend a Left or Right parenthesis to the result of the next execution (Read the next character).
4.  Evaluate if the character is a digit, an operation, or an error, then prepend the corresponding Token to the result of the next execution.

This is a good example of how the language works. The lexer function is
implemented following _pattern match_ on the argument, the `as (@)` operator which
allows us to assign a name to a pattern for its use on the right-hand, and
`guards` that acts like `if elif else` in other languages. When we are defining a function
with `guards`, we do not use the equal sign after the definition, instead, we use
it after each condition.

So with `xs@(x:xs')`, we are define `xs` as the whole input, `x` as the first
character (the head) and `xs'` as the rest of the input (the tail).

The function defined in the listing [1](#code-snippet--ex:lexer), use some helpers function.
`isSpace` and `isDigit` are defined in `Data.Char`. In case, the character at this
point is a digit, the token value is evaluated with the functions `readValue`, and
`stringToDouble` (listing [2](#code-snippet--ex:readValue)). `isOpChar` is defined in
`src/DummyCalc/Lexer/Tokens.hs` (listing [3](#code-snippet--ex:isOpChar))

<a id="code-snippet--ex:readValue"></a>
```haskell
-- | Read a string and returns the number at this position and the remaining
-- | text or an SyntaxError in case of invalid number
stringToDouble :: String -> Either SyntaxError (Double, String)
stringToDouble ('-':xs) = case stringToDouble xs of
                           Right (v, rest) -> Right (-v, rest)
                           Left _ -> Left InvalidNumber
stringToDouble xs'@('.':_) = stringToDouble $ '0':xs'
stringToDouble xs@(x:_)
  | isDigit x = Right (read digitPart :: Double, restPart)
  | otherwise = Left InvalidNumber
  where (digitPart, restPart) = span (\c -> isDigit c  || c == '.') xs
stringToDouble "" = Left InvalidNumber

readValue :: String -> Either SyntaxError (NumValue, String)
readValue xs = case stringToDouble xs of
                     Right (value, left) -> Right (NumValue value, left)
                     Left l -> Left l
```
<div class="src-block-caption">
  <span class="src-block-number"><a href="#code-snippet--ex:readValue">Code Snippet 2</a>:</span>
  readValue converts an string into a value using  the function string to double
</div>

<a id="code-snippet--ex:isOpChar"></a>
```haskell
-- | A list with valid character that composes the operations
opChars :: String
opChars = "+-*/~<=>!&|%^"

-- | Function that returns wheter a character is an operation character or not
isOpChar :: Char -> Bool
isOpChar x = x `elem` opChars

-- | Function that, given a String, returns the correspondent Operation
stringToOperator :: String -> Maybe La.Operation
stringToOperator "+" = Just La.Summatory
stringToOperator "-" = Just La.Difference
stringToOperator "*" = Just La.Multiplication
stringToOperator "/" = Just La.Division
stringToOperator _ = Nothing

-- | Read the character at the current position, and returns the right part,
-- | (La.Operation, String) Tuple, if success, and the left part, an SyntaxError, otherwise
readOperator :: String -> Either SyntaxError (La.Operation, String)
readOperator xs = case stringToOperator op of
                    Just o -> Right (o, rest)
                    Nothing -> Left InvalidOperator
                  where
                    (op, rest) = span isOpChar xs
```
<div class="src-block-caption">
  <span class="src-block-number"><a href="#code-snippet--ex:isOpChar">Code Snippet 3</a>:</span>
  isOpChar checks if the character at point is a valid operation, and if it is the case, convert them to an operation representation
</div>


### Test Suit {#test-suit}

Now we have a function that read a String as input and returns a list of
/Token/s, but we need to test it. To write the test suit, I use the [hspec](https://hspec.github.io/) library.
This library or framework, allows automatic test discover. This library, get a
list of modules that contain tests and execute them, following the TDD
principle. This practice help us to be sure our code works fine.

We need to test dependencies, so on the test-suit of the cabal file, you should have something like:

```cabal
build-depends:
    base ^>=4.17.2.1
  , dummy-calc
  , hspec
  , hspec-discover
  , raw-strings-qq
```

And add the modules where the tests will be written

```cabal
-- Modules included in this executable, other than Main.
other-modules:
    LexerSpec
    ParserSpec
    EvalSpec
```

With all of them, we add the following instruction to invoke the `hspec-discover` in the
`test/Spec.hs` file

```haskell
{-# OPTIONS_GHC -F -pgmF hspec-discover #-}
```


#### Test the lexer function {#test-the-lexer-function}

Once we set up the test suit, we can write our first tests in the file
`test/LexerSpec.hs`. Remember that all the modules have to end with "Spec" to be discovered.

```haskell
module LexerSpec where
import Test.Hspec

import qualified DummyCalc.Lexer as Lexer
import qualified DummyCalc.Lexer.Tokens as Token
import DummyCalc.Language as La

spec :: Spec
spec = do
  describe "Test the lexer function" $ do
    it "Test (5+9)" $
      shouldBe (Lexer.lexer "(5+9)")
               [ Token.TokLeftParen
               , Token.TokNumber $ La.NumValue 5
               , Token.TokOperator $ La.Summatory
               , Token.TokNumber $ La.NumValue 9
               , Token.TokRightParen
               ]
    it "Test 5 + 9" $
      shouldBe (Lexer.lexer "5 + 9")
               [ Token.TokNumber $ La.NumValue 5
               , Token.TokOperator $ La.Summatory
               , Token.TokNumber $ La.NumValue 9
               ]
    it "Test 5 + -9" $
      shouldBe (Lexer.lexer "5 + -9")
               [ Token.TokNumber $ La.NumValue 5
               , Token.TokOperator $ La.Summatory
               , Token.TokOperator $ La.Difference
               , Token.TokNumber $ La.NumValue 9
               ]
    it "Test 7*9/3" $
      shouldBe (Lexer.lexer "7*9/3")
               [ Token.TokNumber $ La.NumValue 7
               , Token.TokOperator $ La.Multiplication
               , Token.TokNumber $ La.NumValue 9
               , Token.TokOperator $ La.Division
               , Token.TokNumber $ La.NumValue 3
               ]
    it "Test let x => 5" $
      shouldBe
        (Lexer.lexer "x => 5")
        [ Token.TokVar $ La.Variable "x"
        , Token.TokEquals
        , Token.TokNumber $ La.NumValue 5
        ]
    it "Test x*9" $
      shouldBe
        ( Lexer.lexer "x*9")
        [ Token.TokVar $ La.Variable "x"
        , Token.TokOperator $ La.Multiplication
        , Token.TokNumber $ La.NumValue 9
        ]
    it "Test x*(9-8)/3+2" $
      shouldBe
        ( Lexer.lexer "x*(9-8)/3+2")
        [ Token.TokVar $ La.Variable "x"
        , Token.TokOperator La.Multiplication
        , Token.TokLeftParen
        , Token.TokNumber $ La.NumValue 9
        , Token.TokOperator La.Difference
        , Token.TokNumber $ La.NumValue 8
        , Token.TokRightParen
        , Token.TokOperator La.Division
        , Token.TokNumber $ La.NumValue 3
        , Token.TokOperator La.Summatory
        , Token.TokNumber $ La.NumValue 2
        ]
    it "Test x=>5;x+3" $
      shouldBe
        ( Lexer.lexer "x=>5;x+3")
        [ Token.TokVar $ La.Variable "x"
        , Token.TokEquals
        , Token.TokNumber $ La.NumValue 5
        , Token.TokEos
        , Token.TokVar $ La.Variable "x"
        , Token.TokOperator La.Summatory
        , Token.TokNumber $ La.NumValue 3
        ]
```


### Define the language symbols. {#define-the-language-symbols-dot}

In the _lexical analysis_ we define the Token list as a small piece of
information. But some of the constructors of the data type requires more
information. For example, the operator and the numbers. Both could be
represented as `Char/String` or a `Double`, but if we define a `Language` module, will
be easier extends it latter. The `Language` module is imported with the
`qualified import` as `DummyCalc.Language as La`. This module, only exports the
`Value` and the `Operation` constructors, but both are defined in `DummyCalc.Language.Data.Internal`

```haskell
module DummyCalc.Language
  ( Value
  , NumValue(..)
  , Operation(..)
  , ValType(..)
  , Variable(..)
  ) where

import DummyCalc.Language.Data.Operations
import DummyCalc.Language.Data.Types
```

And the types are defined as:

```haskell
module DummyCalc.Language.Data.Operations where

-- | A Data type to store the valid opertions
data Operation
  = Summatory
  | Difference
  | Multiplication
  | Division
  | Assign

instance Show Operation where
  show op = case op of
    Summatory       -> "ADD"
    Difference      -> "SUB"
    Multiplication  -> "MUL"
    Division        -> "DIV"
    Assign          -> "ASS"

instance Eq Operation where
  (==) Summatory Summatory            = True
  (==) Difference Difference          = True
  (==) Multiplication Multiplication  = True
  (==) Division Division              = True
  (==) Assign Assign                  = True
  (==) _ _                            = False


data Variable
```

As you can see, the Value only has one constructor, so we can use `newtype`
instead of `data`, But the process is the same.


### Write the parser {#write-the-parser}

At this point, we have the lexer program, that convert a string input into a
list of valid tokens, and an abstraction of the types that our language could
manage. Now we need to convert the tokens into the AST. To make that, we will
use a **recursive descent parsing**

The _recursive descent parser_ is an approach that could be used to parser
languages with relatively simple grammar. It is a _top-down parser_, a type of
parser that begins with a _Start_ symbol and try to determine the parser tree by
working down the levels. By contrast, a _bottom-up parser_, first recognizes the
low-level syntactic units and build the parser from these towards the root.

For our _dummy calc_ we can represent the syntax trees using algebraic data types.
Using the implementation in [42 Abstract Syntax Tree](https://john.cs.olemiss.edu/~hcc/csci450/ELIFP/Ch42/42_Abstract_Syntax.html)

```haskell
instance Show ParErr where
  show (MissingAddOp xs) =
    "MissingAddOp: Missing add-like operator at \"" <> show (takeTokens xs) <> "\""
  show (MissingMulOp xs) =
    "MissingMulOp: Missing mul-like operator at \"" <> show (takeTokens xs) <> "\""
  show (MissingFactor err xs l) =
    "MissingFactor: Missing value or parenthesized expression beginning at \"" <> show
    (takeTokens xs) <> "\" with nested error \n" <> (replicate l '\t') <>
    "[" <> show err <> "]"
  show (MissingValue xs) =
    "MissingValue: Missing value at \"" <> show (takeTokens xs) <> "\""
  show (MissingLeftParen xs) =
```

Each node has an operator and two sides, that are other Expression. With this
representation, we can build any operation and keep the priorities.

For example, in the AST image, we have the operation \\(-x + 2 \* y^3 \\). We
did not implemented the pow operator or the use of variables, so we will replace
the \\(x = 5\\) and the \\(y = 9\\). Also, the _pow_ operation, will be replaced by
\\( y\*y\*y) \\). Now, we have the expression \\(-5 + 2 \* 9 \* 9 \* 9\\). This
expression is equivalent to (+ (-5) (\* (\* (\* 2 9) 9) 9)). As a AST, it is
represent as:

{{< figure src="branch_system_dark.png" >}}


#### Rules {#rules}

When we describe the grammars, we define 3 types of production rules, sequence,
repetition and optional. So, with this in mind, we need to design the formal
grammar used to parse the input and transform it into an AST. It is important to
remember that we need to keep the order of the priorities, the associative and
distribute properties. It is not the same \\( 5 -3 +2 \neq 5 - (3 + 2) \\) or
\\( 5 - 3 \* 2 \neq (5 - 3)\*2 \\). To ensure this, we will move down the multiplication
and division operation, and keep up the sum and difference.

**Note** For portability, I will use uppercase for non-terminal symbols, and
lowercase in other case.

<a id="table--tb:rules"></a>
<div class="table-caption">
  <span class="table-number"><a href="#table--tb:rules">Table 1</a>:</span>
  table with the rules of the grammar
</div>

| Rule | Left side      | Right side              |
|------|----------------|-------------------------|
| 0    | S              | EXPRESSION              |
| 1    | EXPRESSION     | TERM { MORETERMS }      |
| 2    | TERM           | FACTOR { MOREFACTORS }  |
| 3    | FACTOR         | val _or_ NESTEXPRESSION |
| 4    | MORETERMS      | ADDOP TERMINAL          |
| 5    | MOREFACTOR     | MULOP FACTOR            |
| 6    | ADDOP          | + _or_ -                |
| 7    | MULOP          | \* _or_ /               |
| 8    | NESTEXPRESSION | ( EXPRESSION )          |

In Haskell, each rule can be a function that reads the current token, and
returns a tuple with an Expression and the rest of tokens. The functions can be
categorize based on the type of rule they are represented.

<a id="code-snippet--eq:rules"></a>
```haskell
S  ::= E
E  ::= T  U' -- Sequence
U' ::= { U } -- zero or more ocurrence
T  ::= F  G'
G' ::= { G }
-- F  ::= [ '-' ] n | l E r -- Alternative and opcional
F  ::= D | N
D  ::= ['-'] n
N  ::= l E r
U  ::= ('+' | '-') T
G  &::= ('*' | '/') F
```

The rule 1 in table [1](#table--tb:rules), can be refactor into the equation
. Now we have tree rules, all of them match only one of the rules
pattern described previously. The implementation, is in the file
`src/DummyCalc/Parser.hs`.

<a id="code-snippet--eq:rule1"></a>
```haskell
expression ::=  term moreTerms
moreTerms  ::=  { addterm }
addterm    ::= addop term
```

<a id="code-snippet--eq:rule2"></a>
```haskell
term        ::= factor moreFactors
moreFactors ::= { mulFactor }
mulFactor   ::= mulOp factor
```

The rule 3, that apply to a factor, has 2 options. Convert the factor into a
value, or into a nest expression. This case can be represented a `try/catch` where
first try to convert into a value, if the program fails, then try to convert
into a nest expression.

The final grammar looks like:

<a id="code-snippet--eq:rules"></a>
```haskell
S  &::= E
E  &::= T  U' -- Sequence
U' &::= { U } -- zero or more ocurrence
T  &::= F  G'
G' &::= { G }
-- F  &::= [ '-' ] n | l E r -- Alternative and opcional
F  &::= D | N
D  &::= ['-'] n
N  &::= l E r
U  &::= ('+' | '-') T
G  &::= ('*' | '/') F
```


#### Combining the expression {#combining-the-expression}

The last part consists on combining the expression into operations. At this
point, we only have binary operations, so we need to combine 2 expression within
a operator just defined. Also, we need to combine them left to right. So, we
need to read a initial expression, and a list of `(operation,  expression)` and
return a new expression, as we can see in `src/DummyCalc/Parser/AST.hs`.

```haskell
-- | Shortcut for the header 2 expressions as parameters and returns a new one.
type Constructor = Expr -> Expr -> Expr

{- |
Given an initial expression, and a list of tuples with operators and expression,
returns a new expression that wrap all the sequence.

The process is recursive, so we need to combine the first 2 expression into only
one, and continue the process until finish the list

-}
makeBinOpSeq :: Expr -> [(La.Operation, Expr)] -> Expr
makeBinOpSeq e1 [] = e1
makeBinOpSeq e1 ((op,e2):xs) = makeBinOpSeq (makeBinOp op e1 e2) xs


{- |
Takes a valid binary operator and its left and right operand expression and
returns the corresponding expression. It use association list `assocOpCons' to
associte the valid operator with the Expr constructors.
-}
makeBinOp :: La.Operation -> Constructor
makeBinOp op e1 e2 =
  case lookup op assocOpCons of
    Just c -> c e1 e2
    Nothing -> error ("Invalid operator " <> show op)
  where
    assocOpCons =
      [
        (La.Summatory, Add),
        (La.Difference, Sub),
        (La.Multiplication, Mul),
        (La.Division, Div)
      ]
```
