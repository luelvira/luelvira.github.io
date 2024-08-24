+++
title = "Sudoku resolver"
author = ["Lucas Elvira Martín"]
date = 2024-08-24
lastmod = 2024-08-24T19:09:11+02:00
tags = ["python"]
draft = false
weight = 2001
Source = [["https://github.com/luelvira/sudoku_resolver"]]
projects = "sudoku_resolver"
+++

This project involved the development of a Python program designed to solve
Sudoku puzzles using optimization techniques. The primary goal was to create an
algorithm that not only accurately solves Sudoku puzzles but also does so in an
efficient manner, improving both the quality and speed of the solution. The
project was driven by a personal interest in enhancing my own method of solving
Sudokus, with a focus on replicating and optimizing the mental strategies I use
when playing the game.

The techniques used to improve the efficiency was: First, find and fill all
cells that only has one possibility. Second, sort the white cells with the
number of possibles values and resolve in this order. Then repeat the step 1
and two until the problem state is stable. Finally, use backtracking to resolve
the rest of the cells.

The project required a deep understanding of Sudoku mechanics and the
development of an algorithm capable of mimicking human problem-solving
processes, breaking down the puzzle into manageable steps, and applying logical
deductions systematically.

One of the main challenges of the project was to analyze and translate my
personal approach to solving Sudokus into a clear, executable algorithm. This
involved dissecting my mental process during gameplay, identifying patterns and
strategies I intuitively use, and then coding these steps in a way that a
machine could replicate. The project also included refining the algorithm to
improve its efficiency, reducing the time required to solve puzzles, especially
as they increase in difficulty.

Although the target audience for this project was primarily myself, the work
provided valuable insights into algorithmic thinking and problem-solving in
Python. It also offered a unique opportunity to bridge the gap between human
intuition and machine logic, resulting in a tool that effectively mirrors the
way I approach and solve Sudoku puzzles.
