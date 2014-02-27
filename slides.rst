:title: Advanced Python
:author: Carl Meyer
:description: a presentation for ConFoo 2014
:keywords: presentation, advanced, python, confoo

:skip-help: true
:data-transition-duration: 400


----

:id: title

Advanced Python
===============

|hcard|

----

:id: thistalk
:data-reveal: 1

This talk
---------

* Decorators

* Context managers

* Descriptors

* Iterators

* Generators

.. 30 seconds.

----

:data-reveal: 1

How
----

* Introduce a feature

* Example(s)

* Cautions?

* Areas to explore

* Link to docs

* Python 3

.. note::

   Docs links on final slide. No stress; doc links will be live in online
   slides.

   All code is Py3, but will note Py2 differences.

.. 45 seconds.

----

:data-reveal: 1

Me
----

* Writing Python since 2002.

* Professionally since 2007.

* Mostly web development.

* OSS: pip, virtualenv, Django

.. 30 seconds.

----

:data-emphasize-lines-step: 1,5,6,7,10

Decorators
==========

Python functions are first class:

.. code:: pycon
   :number-lines:

   >>> def say_hi():
   ...     print("Hi!")
   ...

   >>> def call_twice(func):
   ...     func()
   ...     func()
   ...

   >>> call_twice(say_hi)
   Hi!
   Hi!

.. note::

   We can pass a function around like any other object.

   Pass it as an argument to another function (no parens is reference, parents
   means a call).

   Then call it by another name, twice (now parens!)

----

:data-reveal: 1
:data-emphasize-lines-step: 1,2,3,4,5,6,8,11,12,13

Decorator
---------

A function that takes a function as an argument, and returns a function.

.. code:: pycon
   :number-lines:

   >>> def noisy(func):
   ...    def decorated():
   ...        print("Before")
   ...        func()
   ...        print("After")
   ...    return decorated

   >>> say_hi_noisy = noisy(say_hi)

   >>> say_hi_noisy()
   Before
   Hi!
   After

.. note::

   We pass in say_hi to noisy, and get back the function "decorated"; when we
   call it, we get the Before, then the function we passed in (say_hi) is
   called, then we get After.

   The function "decorated" is a closure; it "closes over" the value of the
   variable "func" in its containing scope.

----

:data-emphasize-lines-step: 4,5

Decorator syntax
----------------

In place of:

.. code:: python
   :number-lines:

   def say_hi():
       print("Hi!")

   say_hi = noisy(say_hi)

we can write:

.. code:: python
   :number-lines:

   @noisy
   def say_hi():
       print("Hi!")

.. note::

   If we don't need the original (undecorated) function.

----

:data-emphasize-lines-step: 1,2,3,4

Either way:
-----------

.. code:: pycon
   :number-lines:

   >>> say_hi()
   Before
   Hi!
   After

----

Let's try another:
------------------

.. code:: pycon

   >>> @noisy
   ... def square(x):
   ...     return x * x
   ...

   >>> square(3)
   Traceback (most recent call last):
     File "<stdin>", line 1, in <module>
   TypeError: decorated() takes 0 positional arguments but
              1 was given

Oops!
-----

----

:data-emphasize-lines-step: 2,4

The cause
---------

.. code:: python
   :number-lines:

   def noisy(func):
       def decorated():
           print("Before")
           func()
           print("After")
       return decorated

.. note::

   Our wrapper decorated function takes no arguments, and passes none on to the
   wrapped function.

   So it can only wrap functions that require no arguments.

----

:data-emphasize-lines-step: 2,4

The fix: ``*args`` and ``**kwargs``
------------------------------------

to write decorators that can wrap any function signature:

.. code:: python
   :number-lines:

   def noisy(func):
       def decorated(*args, **kwargs):
           print("Before")
           func(*args, **kwargs)
           print("After")
       return decorated

.. note::

   Depends on the type of decorators. Some decorators might look at or even
   change the arguments, so this total flexibility wouldn't work.

----

:data-emphasize-lines-step: 3,4,5,6

A real example
--------------

.. code:: python
   :number-lines:

   def login_required(view_func):
       def decorated(request, *args, **kwargs):
           if not request.user.is_authenticated():
               return redirect('/login/')
           return view_func(request, *args, **kwargs)
       return decorated

   @login_required
   def edit_profile(request):
       pass # ...

.. note::

   Simplified from the actual implementation.

----

:data-reveal: 1

Cautions
--------

* Decorator becomes part of the function.

* Can't test the plain pre-decorated function.

* Only use if:

* Decorated version is equally testable

* and the only version you need.

* Careful with decorator side effects (e.g. registries of functions): modules
  can be imported multiple times (or not at all), imports should generally not
  have side effects.

----

:data-reveal: 1

Further exploration
-------------------

* Using ``functools.wraps`` to preserve the name and docstring of the decorated
  function.

* Configurable decorators, or decorators with arguments (really decorator
  factories).

* *Optionally* configurable decorators (might be a decorator factory, might be
  a decorator, depending how it's used).

----

:data-reveal: 1
:data-emphasize-lines-step: 1,2

Context managers
----------------

.. code:: python
   :number-lines:

   with open('somefile.txt', 'w') as fh:
       fh.write('contents\n')

Opens the file, then executes the block, then closes the file.

* Even if an exception was raised in the block.

* Like decorators, allow wrapping code with before/after actions.

* But around any block of code, not just functions.

----

Can replace try/finally
-----------------------

In place of:

.. code:: python

   fh = open('somefile.txt', 'w')
   try:
       fh.write('contents\n')
   finally:
       fh.close()

we can write:

.. code:: python

   with open('somefile.txt', 'w') as fh:
       fh.write('contents\n')

.. note::

   More concise syntax for resource management / cleanup.

----

:data-emphasize-lines-step: 2,6,7,8,10,11,14

Writing a context manager
-------------------------

If ``open`` weren't already a context manager, we might write one:

.. code:: python
   :number-lines:

   class MyOpen:
       def __init__(self, filename, mode='r'):
           self.filename = filename
           self.mode = mode

       def __enter__(self):
           self.fh = open(self.filename, self.mode)
           return self.fh

       def __exit__(self, exc_type, exc_value, traceback):
           self.fh.close()


   with MyOpen('somefile.txt', 'w') as fh:
       fh.write('contents\n')

.. note::

   ``open`` already can act like a context manager. But if not, here's a
   simplified example of how we could implement it.

   Just any object with ``__enter__`` and ``__exit__`` methods.

   Return value of ``__enter__`` accessible via ``as`` keyword.

----

:data-emphasize-lines-step: 3,5,6,7,8,9,11,12,13,14,15,16

Exception handling
------------------

.. code:: python
   :number-lines:

    class NoisyCM:
        def __enter__(self):
            print("Entering!")

        def __exit__(self, exc_type, exc_value, traceback):
            print("Exiting!")
            if exc_type is not None:
                print("Caught {}".format(exc_type.__name__))
                return True

.. code:: pycon
   :number-lines:

   >>> with NoisyCM():
   ...     print("Inside!")
   ...     raise ValueError
   Entering!
   Inside!
   Exiting!
   Caught ValueError

.. note::

   ``__exit__`` gives us info on any exception raised inside the with block

   Can return ``True`` to suppress it, else it will propagate.

----

:data-emphasize-lines-step: 1,3,4,5,7,8,9,12

Convenience method
------------------

.. code:: python
   :number-lines:

   from contextlib import contextmanager

   @contextmanager
   def my_open(filename, mode='r'):
       fh = open(filename, mode)
       try:
           yield fh
       finally:
           fh.close()


   with my_open('somefile.txt', 'w') as fh:
       fh.write('contents\n')

.. note::

   When even a class with two methods is too much boilerplate,
   ``contextmanager`` streamlines it.

   Uses a decorator! Also a generator (yield statement); we'll see that soon.

   Yielded value goes to 'as' clause; after the block, resumes after the yield.

   If we want unconditional cleanup we still need to use a try/finally.

----

:data-emphasize-lines-step: 3,4,5

Example: transaction API
------------------------

.. ignore-next-block

.. code:: python
   :number-lines:

   from django.db import transaction

   with transaction.atomic():
       write_to_the_database()
       write_to_the_database_some_more()

Opens a database transaction on enter, commits it on exit (or rolls it back if
there was an exception).

----

:data-emphasize-lines-step: 1,3,4,5

Example: test assertion
-----------------------

.. code:: python
   :number-lines:

   import pytest

   def test_cannot_divide_by_zero():
       with pytest.raises(ZeroDivisionError):
          1 / 0

----

:data-reveal: 1

Cautions
--------

* None!

* Context managers are awesome.

* Use them anywhere you need to manage resource life-cycles; setup/teardown;
  entry/exit.

----

Descriptors
===========

----

:data-emphasize-lines-step: 1,5,7,10,12,15,20

Attributes are simple:

.. code:: pycon
   :number-lines:

   >>> class Person:
   ...     def __init__(self, name):
   ...         self.name = name

   >>> p = Person(name="Arthur Belling")

   >>> p.name
   'Arthur Belling'

   >>> p.name = "Arthur Nudge"

   >>> p.name
   'Arthur Nudge'

   >>> del p.name

   >>> p.name
   Traceback (most recent call last):
   ...
   AttributeError: 'Person' object has no attribute 'name'

.. note::

   We can get them, set them, and delete them.

----

:data-reveal: 1

Python is not Java
------------------

* Attributes in Python are public.

* We use attributes directly, not getters and setters.

* But what if the implementation needs to change?

* Descriptors!

* Simple attribute from the outside.

* Anything you want on the inside.

----

:data-emphasize-lines-step: 2,3,4,6,7,8,10,11,12

.. code:: python
   :number-lines:

   class NoisyDescriptor:
       def __get__(self, obj, objtype):
            print("Getting")
            return obj._val

       def __set__(self, obj, val):
            print("Setting to {}".format(val))
            obj._val = val

       def __delete__(self, obj):
            print("Deleting")
            del obj._val


.. note::

   Still need to store underlying data somewhere. Here we use "_val" (private,
   not enforced)

   Only one instance of this decorator can be used per-class w/out sharing data.

   Could pass in a name, generate one, use a metaclass...

----

:data-emphasize-lines-step: 1,2,4,6,7,9,10,12,13,16,17

.. code:: pycon
   :number-lines:

   >>> class Person:
   ...     name = NoisyDescriptor()

   >>> luigi = Person()

   >>> luigi.name = "Luigi"
   Setting to Luigi

   >>> luigi._val
   'Luigi'

   >>> luigi.name
   Getting
   'Luigi'

   >>> del luigi.name
   Deleting

.. note::

   We set the descriptor as a class attribute.

   Then when we get, or set, or delete the ``name`` attribute of an instance of
   that class, it goes through the descriptor's methods.

----

Head asplode
------------

* Descriptors are extremely powerful.

* Usually, you don't need all that.

* The built-in ``@property`` decorator is a simpler way to build a descriptor
  for the common cases.

----

:data-emphasize-lines-step: 1,3,4,6,7,8,9,10,12,17

calculated property
-------------------

.. code:: python
   :number-lines:

   class Person:
       def __init__(self, first_name, last_name):
           self.first_name = first_name
           self.last_name = last_name

       @property
       def full_name(self):
           return "{} {}".format(
               self.first_name, self.last_name)


.. code:: pycon
   :number-lines:

   >>> p = Person("Eric", "Praline")

   >>> p.full_name
   'Eric Praline'

   >>> p.full_name = "John Cleese"
   Traceback (most recent call last):
   AttributeError: can't set attribute

.. note::

   Use the built-in 'property' decorator to turn a method into a descriptor
   with `__get__`.

   Note we access it as an attribute; from the outside there is no clue that it
   isn't an ordinary attribute.

   Until we try to set it, that is - it's read-only.

----

:data-emphasize-lines-step: 1,2,3,4,6,7,8,9,14,16,18

boolean-only attribute
----------------------

.. code:: python
   :number-lines:

   class User:
       @property
       def is_admin(self):
           return self._is_admin

       @is_admin.setter
       def is_admin(self, val):
           if val not in {True, False}:
               raise ValueError(
                   'is_admin must be True or False')
           self._is_admin = val

.. code:: pycon
   :number-lines:

   >>> u = User()

   >>> u.is_admin = True

   >>> u.is_admin = 'foo'
   Traceback (most recent call last):
   ValueError: is_admin must be True or False

.. note::

   Define the getter same as before; internally we are using "_is_admin" to
   store the value.

   Then it gets interesting:

   * ``property`` turns ``is_admin`` into a descriptor.
   * The descriptor has a ``setter`` method, which is a decorator.
   * We use that decorator to define a setter for this property.

   In our setter we check to ensure the value is boolean, and if so, set it.

   If not, raise a ValueError.

   (``deleter`` is also available.)

----

:data-reveal: 1

Descriptors & properties
------------------------

* Hide getters & setters behind simple-attribute facade.

* Descriptor protocol is fundamental to Python's object model: used internally
  to implement bound methods, staticmethods, classmethods...

* For most cases ``@property`` is simpler than a custom descriptor class.

* In Python 2, can only be used with "new-style" classes (inherit ``object``).

----

Iterables, iterators, & generators, oh my!
------------------------------------------

----

:data-emphasize-lines-step: 1,3,4,5,6,7

Iteration is simple.
--------------------

.. code:: pycon
   :number-lines:

   >>> numbers = [1, 2, 3]

   >>> for num in numbers:
   ...     print(num)
   1
   2
   3

.. note::

   We can make a list, and then use ``for ... in ...`` to iterate over that
   list.

----

:data-reveal: 1

What is **iterable**?
---------------------

* Builtin types: list, set, tuple, dict...

* Any object with an ``__iter__`` method.

* The ``__iter__`` method must return an **iterator**.

.. note::

   The term for objects that we can iterate over is "iterable".

   Many built-in types are iterable: list, set, tuple, dict...

   Any object can be iterable; it just needs an ``__iter__`` method.

   Which must return an iterator.

   Which of course raises the question...

----

:data-reveal: 1

Ok, what's an **iterator**?
---------------------------

* An **iterator** keeps track of where we are in iterating over some iterable.

* Only goes one direction (forward) and is one-and-done; no rewinding.

* Has a ``__next__()`` method that gives us the next item when we ask for it.

* ``__next__()`` raises a ``StopIteration`` exception when there are no more
  items.

* Used internally every time you use ``for ... in``, but usually hidden.

* But we can see one, now that we know where to look...

----

:data-reveal: 1

An aside: magic methods
-----------------------

* Python's data model is largely implemented via "magic-method protocols."

* E.g. any object can implement a ``__len__()`` method; ``len(obj)`` is
  equivalent to ``obj.__len__()``.

* Allows user classes to participate fully in the language syntax; not be
  second-class to built-in types.

* Many others: comparison (e.g. ``__eq__()``), type conversion
  (e.g. ``__str__()``), attribute access (e.g. ``__getattr__()``), descriptors
  (``__get__()`` et al). Look up the full list!

* The iterable (``__iter__()``) and iterator (``__next__()``) protocols.

* As with ``len()``, there are ``iter()`` and ``next()`` built-ins;
  ``iter(obj)`` just calls ``obj.__iter__()``.

----

:data-emphasize-lines-step: 1,3,6,9,12,15,19

an iterator sighting!
---------------------

.. code:: pycon
   :number-lines:

   >>> numbers = [1, 2, 3]

   >>> iterator = iter(numbers)

   >>> iterator
   <list_iterator object at 0x...>

   >>> next(iterator)
   1

   >>> next(iterator)
   2

   >>> next(iterator)
   3

   >>> next(iterator)
   Traceback (most recent call last):
   StopIteration

.. note::

   We can get an iterator for a list, and then keep calling ``next()`` on it
   and getting the next item in the list, until finally it raises
   ``StopIteration``.

   Wondering why you don't see ``StopIteration`` all over the place? The
   ``for`` loop (and other kinds of built-in iteration, such as comprehensions)
   catch it for you; that's how they know when iteration is done.

----

:data-emphasize-lines-step: 1,4,5,6,7

The true story of a for loop
----------------------------

What really happens when we ``for x in numbers: print(x)``:

.. code:: python
   :number-lines:

   iterator = iter(numbers)
   while True:
       try:
           x = next(iterator)
       except StopIteration:
           break
       print(x)

.. note::

   Get an iterator, keep calling ``next()`` on that iterator until it raises
   ``StopIteration``.

----

:data-emphasize-lines-step: 1,3,5,8,11,16,17,18,19

Iterator independence
---------------------

.. code:: pycon
   :number-lines:

   >>> numbers = [1, 2]

   >>> iter1 = iter(numbers)

   >>> iter2 = iter(numbers)

   >>> next(iter1)
   1

   >>> next(iter2)
   1

   >>> for x in numbers:
   ...     for y in numbers:
   ...         print(x, y)
   1 1
   1 2
   2 1
   2 2

.. note::

   We can get two different iterators for the same underlying list, and they
   each maintain their own separate iteration state.

   This is why you can do nested for loops over the same list, and they don't
   interfere with each other.

----

:data-emphasize-lines-step: 5,7,8,9,11

iterators are iterable
----------------------

Iterators should define an ``__iter__()`` method that returns ``self``.

This means an iterator is also iterable (but one-shot).

.. code:: pycon
   :number-lines:

   >>> numbers = [1, 2, 3]

   >>> iterator = iter(numbers)

   >>> for num in iterator:
   ...     print(num)
   1
   2
   3

   >>> for num in iterator:
   ...     print(num)


.. note::

   Also, because iterators are one-shot, you can't do nested loops over the
   same iterator like you can with a list (whose ``__iter__()`` returns a new
   iterator each time).

----

Let's try writing our own
-------------------------

----

:data-emphasize-lines-step: 3,4,6,7,8,9,11,12,13,15,16

A fibonacci iterator
---------------------

.. code:: python
   :number-lines:

   class Fibonacci:
       def __init__(self):
           self.last = 0
           self.curr = 1

       def __next__(self):
           self.last, self.curr = (
               self.curr, self.last + self.curr)
           return self.last

       def __iter__(self):
           return self

.. code:: pycon
   :number-lines:

   >>> f = Fibonacci()

   >>> print(next(f), next(f), next(f), next(f), next(f))
   1 1 2 3 5

.. note::

   Fibonacci is always used as an example of recursion -- we're going to use it
   as a demonstration of iteration instead.

   We define a ``__next__()`` method (makes it an iterator) and an
   ``__iter__()`` method that returns itself (so its iterable; we can use it in
   a for loop.

   But I don't use it in a for loop. Why? Note we never raise ``StopIteration``
   from ``next()``; this is an infinite iterator!

----

:data-emphasize-lines-step: 3,5,8

itertools: iterator plumbing
----------------------------

.. code:: pycon
   :number-lines:

   >>> from itertools import takewhile

   >>> fib = takewhile(lambda x: x < 100000, Fibonacci())

   >>> multiple_of_7 = filter(lambda x: not x % 7, fib)

   >>> list(multiple_of_7)
   [21, 987, 46368]

.. note::

   The ``itertools`` module contains a bunch of "pipes" you can connect
   together to do interesting things with iterators.

   Just one quick example - check out the docs for lots more!

   We use ``takewhile`` to limit the infinite Fibonacci iterator to just
   elements under 100,000.

   Then we use ``filter`` to filter it down to just those that are divisible by
   7.

   This processes only one element at a time, so we won't exhaust memory no
   matter how high we go.

----

:data-reveal: 1

Generators
----------

* A simpler way to write a function that returns an iterator.

* Any function whose body contains a ``yield`` statement is a generator.

* When the function is called, nothing in its body is executed yet, but it
  returns a generator object (which is an iterator).

* When the generator's ``__next__()`` method is called, it executes the
  function body until a ``yield`` and returns the yielded value.

* Repeat.

* When execution in the function body hits a ``return`` or falls off the end,
  the generator raises ``StopIteration``.

----

:data-emphasize-lines-step: 2,3,4,5,9,11,12,13,15,16,17,19,21

.. code:: python
   :number-lines:

   def toygen():
       print("Starting function body.")
       yield 1
       print("Between yields.")
       yield 2

.. code:: pycon
   :number-lines:

   >>> gen = toygen()

   >>> gen
   <generator object toygen at 0x...>

   >>> next(gen)
   Starting function body.
   1

   >>> next(gen)
   Between yields.
   2

   >>> next(gen)
   Traceback (most recent call last):
   StopIteration

----

:data-emphasize-lines-step: 1,5,9,11,12

Fibonacci generator
-------------------

.. code:: python
   :number-lines:

   def fibonacci():
       last, curr = 0, 1
       while True:
           last, curr = curr, curr + last
           yield last

.. code:: pycon
   :number-lines:

   >>> fib = fibonacci()

   >>> fib
   <generator object fibonacci at 0x...>

   >>> list(takewhile(lambda x: x < 20, fib))
   [1, 1, 2, 3, 5, 8, 13]

.. note::

   The generator implementation is clearly shorter than the iterator class we
   wrote before; a simple function instead of a class with multiple methods.

----

:data-emphasize-lines-step: 1,2,3,4,5

Re-implementing itertools.takewhile
-----------------------------------

.. code:: python
   :number-lines:

   def my_takewhile(predicate, iterator):
       for elem in iterator:
           if not predicate(elem):
               break
           yield elem

.. note::

   ``takewhile`` can be easily implemented as a generator.

   Just loop over the items in the incoming iterator, yielding them one at a
   time, and breaking out of the loop the first time we hit an element that
   fails the predicate test.

----

generator expressions
---------------------

----

:data-emphasize-lines-step: 1,3,4,6,7

A **list comprehension** is a concise expression to build/transform/filter a
list:

.. code:: pycon
   :number-lines:

   >>> numbers = [1, 2, 3]

   >>> [n*2 for n in numbers]
   [2, 4, 6]

   >>> [n for n in numbers if n % 2]
   [1, 3]

----

:data-emphasize-lines-step: 1,3
:data-reveal: 1

Replace the brackets with parens, and you have a **generator expression**:

.. code:: pycon
   :number-lines:

   >>> odd_fib = (n for n in fibonacci() if n % 2)

   >>> doubled_fib = (n*2 for n in fibonacci())

* Looks like a list comprehension, but doesn't build the full list in memory.

* Creates a generator which lazily waits to be iterated over.

.. note::

   A generator expression is a very concise way to transform each element in an
   iterator, and/or filter an iterator. (Can replace the ``filter`` built-in,
   as we see here).

----

:data-reveal: 1

__iter__() as a generator
-------------------------

* The ``__iter__()`` method on your iterable class must return an iterator.

* Generator functions return an iterator!

----

:data-emphasize-lines-step: 3,6,7,13

.. code:: python
   :number-lines:

   class ErrorList:
       def __init__(self):
           self.errors = []

       def __iter__(self):
           for error in self.errors:
               yield error

or, even shorter:

.. code:: python
   :number-lines:

   class ErrorList:
       def __init__(self):
           self.errors = []

       def __iter__(self):
           return iter(self.errors)

----

:data-reveal: 1

Iterators & generators
----------------------

* Good to understand the underlying iterator protocol (``__next__()`` and
  ``StopIteration``),

* ...but generators (``yield``) and generator expressions will do most of what
  you need.

* Can write data pipelines that transform/filter very long (even infinite)
  streams one element at a time,

* ...without ever bringing all data into memory at once.

* Can make your own classes iterable by giving them an ``__iter__()`` method.

* Further exploration: dive into the ``itertools`` module!

----

Metaclasses
-----------

    “Metaclasses are deeper magic than 99% of users should ever worry about. If
    you wonder whether you need them, you don't.”

    -- Tim Peters, comp.lang.python

.. note::

   This quote is basically obligatory at this point in any discussion of Python
   metaclasses.

   Because of that, and because it's just too much to cover, we'll leave it
   there - metaclasses will go on the "further exploration" list.

----

:data-reveal: 1

Review
======

* **Decorators**: reuse common pre- and post- behaviors across many functions.

* **Context managers**: run setup and teardown around any block of code.

* **Descriptors** (and **@property**): customize attribute access on your
  classes.

* **Iterators** and **generators**: make your classes iterable, and
  process/filter/transform data streams lazily one item at a time.

* **Metaclasses** are deep magic.

----

:id: questions

Questions?
==========

* `oddbird.net/advanced-python-preso`_
* `docs.python.org/3/reference/datamodel.html`_
* `docs.python.org/3/glossary.html`_
* `docs.python.org/3/howto/descriptor.html`_
* `docs.python.org/3/tutorial/classes.html`_
* `docs.python.org/3/library/itertools.html`_

.. _oddbird.net/advanced-python-preso: http://oddbird.net/advanced-python-preso
.. _docs.python.org/3/glossary.html: http://docs.python.org/3/glossary.html
.. _docs.python.org/3/reference/datamodel.html: http://docs.python.org/3/reference/datamodel.html
.. _docs.python.org/3/howto/descriptor.html: http://docs.python.org/3/howto/descriptor.html
.. _docs.python.org/3/tutorial/classes.html: http://docs.python.org/3/tutorial/classes.html
.. _docs.python.org/3/library/itertools.html: http://docs.python.org/3/library/itertools.html

|hcard|

.. |hcard| raw:: html

   <div class="vcard">
   <a href="http://www.oddbird.net">
     <img src="images/logo.svg" alt="OddBird" class="logo" />
   </a>
   <h2 class="fn">Carl Meyer</h2>
   <ul class="links">
     <li><a href="http://www.oddbird.net" class="org url">oddbird.net</a></li>
     <li><a href="https://twitter.com/carljm" rel="me">@carljm</a></li>
   </ul>
   </div>
