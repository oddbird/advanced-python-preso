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

* Metaclasses

.. 30 seconds.

----

:data-reveal: 1

How
----

* Introduce a feature

* Example(s)

* Just a taste!

* Cautions?

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

Decorators
==========

Python functions are first class:

.. code:: pycon

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
:data-emphasize-lines-step: 3,5,11,13

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

Either way:
-----------

.. code:: pycon
   :number-lines:

   >>> say_hi()
   Before
   Hi!
   After

----

:data-emphasize-lines-step: 2,6

But:
----

.. for some reason doctest chokes on the help() call here
.. ignore-next-block
.. code:: pycon
   :number-lines:

   >>> say_hi
   <function noisy.<locals>.decorated at 0x...>

   >>> help(say_hi)
   Help on function decorated:
   decorated()

.. note::

   The help and repr for our function now say nothing about ``say_hi``, they
   claim that it's the inner function returned from the decorator.

   Which it is!

   But we'd like to hide this and treat it as if it were the original function.

----

:data-emphasize-lines-step: 1,4

Fixing ``repr()`` and ``help()``
--------------------------------

.. code:: python
   :number-lines:

   from functools import wraps

   def noisy(func):
       @wraps(func)
       def decorated():
           print("Before")
           func()
           print("After")
       return decorated

.. note::

   Python standard library has a decorator that helps us make decorators!

   Copies the function name and docstring of the decorated function onto the
   decorator, so it isn't obscured.

----

:data-emphasize-lines-step: 7,11

Fixed!
------

.. code:: pycon
   :number-lines:

   >>> @noisy
   ... def say_hi():
   ...     print("Hi!")
   ...

   >>> say_hi
   <function say_hi at 0x...>

   >>> help(say_hi)
   Help on function say_hi:
   say_hi()

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

:data-emphasize-lines-step: 3,5

Use ``*args`` and ``**kwargs``
------------------------------

to write decorators that can wrap any function signature:

.. code:: python
   :number-lines:

   def noisy(func):
       @wraps(func)
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
       @wraps(view_func)
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

   Here we are hardcoding the login URL to redirect to.

----

:data-emphasize-lines-step: 1,2,6,9,11

Configurable decorators
-----------------------

.. code:: python
   :number-lines:

   def login_required(login_url):
       def actual_decorator(view_func):
           @wraps(view_func)
           def decorated(request, *args, **kwargs):
               if not request.user.is_authenticated():
                   return redirect(login_url)
               return view_func(request, *args, **kwargs)
           return decorated
       return actual_decorator

   @login_required('/login/')
   def edit_profile(request):
       pass # ...

.. note::

   A decorator that takes arguments is really a decorator factory: a function
   that returns a decorator.

   And a decorator, of course, is a function that returns a function: so we end
   up with double-nested closures.

----

:data-emphasize-lines-step: 1,9,10,13,17

Optionally configurable
-----------------------

.. code:: python
   :number-lines:

   def login_required(view_func=None, login_url='/login/'):
       def actual_decorator(func):
           @wraps(func)
           def decorated(request, *args, **kwargs):
               if not request.user.is_authenticated():
                   return redirect(login_url)
               return func(request, *args, **kwargs)
           return decorated
       if view_func is not None:
           return actual_decorator(view_func)
       return actual_decorator

   @login_required
   def view_profile(request):
       pass # ...

   @login_required(login_url='/other_login/')
   def edit_profile(request):
       pass # ...

.. note::

   Combining the last two forms of decorators, returning either a decorator, or
   an already-decorated view function, depending what arguments we get.

   Could avoid the implementation complexity if we didn't mind a pair of empty
   parens in the first usage, but requiring those makes it easier to use the
   decorator wrong.

   This requires passing in login_url as a keyword argument, we could be even
   cleverer if we want by type-checking the first argument (is it a function?
   is it a string?)

----

:data-emphasize-lines-step: 4,6,7,8,9

With lazy return values:
-------------------------

.. code:: python
   :number-lines:

   def sort(func):
       @wraps(func)
       def decorated(request, *args, **kwargs):
           sort_by = request.GET.get('sort')
           response = func(request, *args, **kwargs)
           if sort_by:
               ctx = response['context']
               ctx['queryset'] = ctx['queryset'].order_by(
                   sort_by)
           return response
       return decorated

   @sort
   def list_widgets(request):
       return TemplateResponse(
           request,
           'widget_list.html',
           {'queryset': Widget.objects.all()},
           )

.. note::

   TemplateResponse renders an HTML template lazily.

   Our decorator can poke at the context before the template is rendered, to
   sort the queryset.

   This decorator can provide generic sortability to any view that renders a
   queryset in its template.

   (Needs error handling.)

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

Context managers
----------------

.. code:: python

   with open('somefile.txt', 'w') as fh:
       fh.write('contents\n')

* Like decorators, allow before/after actions.

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

The context manager closes the file after the block.

.. note::

   More concise syntax for resource management / cleanup.

----

:data-emphasize-lines-step: 2,6,7,8,10,11,13

Writing a context manager
-------------------------

If ``open()`` weren't already a context manager, we might write one:

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

:data-emphasize-lines-step: 7,9,12,16

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

:data-emphasize-lines-step: 1,3,7,8

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

:data-reveal: 1

Cautions
--------

* None!

* Context managers are awesome.

* Use them anywhere you need to manage resource life-cycles; setup/teardown.

----

Descriptors
===========

----

:data-emphasize-lines-step: 7,10,15

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

:data-emphasize-lines-step: 3,7,11

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

:data-emphasize-lines-step: 2,7,10,14

.. code:: pycon
   :number-lines:

   >>> class Person:
   ...     name = NoisyDescriptor()

   >>> luigi = Person()

   >>> luigi.name = "Luigi"
   Setting to Luigi

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

Head Asplode
------------

* Descriptors are extremely powerful.

* Usually, you don't need all that.

* The built-in ``@property`` decorator is a simpler way to build a descriptor
  for the common cases.

----

:data-emphasize-lines-step: 6,12,17

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

:data-emphasize-lines-step: 4,6,7,9,18

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

   (``deleter`` and ``getter`` also available.)

----

:data-emphasize-lines-step: 2,5,11

alternate spelling
------------------

.. code:: python
   :number-lines:

   class User:
       def _get_is_admin(self):
           return self._is_admin

       def _set_is_admin(self, val):
           if val not in {True, False}:
               raise ValueError(
                   'is_admin must be True or False')
           self._is_admin = val

       is_admin = property(_get_is_admin, _set_is_admin)

.. note::

   If you find the decorators for getter/setter properties hard to grok, you
   might find this alternate spelling clearer.

   Just define the getter and setter with private names and pass in to the
   property constructor.

   Same effect as before.

   Can pass in a deleter method as third arg.

----

:data-reveal: 1

Descriptors & properties
------------------------

* Hide getters & setters behind simple-attribute facade.

* Descriptor protocol is fundamental to Python's object model: used internally
  to implement bound methods, staticmethods, classmethods...

* For most cases ``property`` is simpler than a custom descriptor class.

* In Python 2, can only be used with "new-style" classes (inherit ``object``).

----

Iterables, iterators, & generators, oh my!
------------------------------------------

----

Iteration is simple.
--------------------

.. code:: pycon

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

* List, set, tuple, dict...

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

* An **iterator** keeps track of where we are in iterating over some
  collection.

* Has a ``__next__()`` method that gives us the next item when we ask for it.

* Raises a ``StopIteration`` exception when there are no more items.

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

* the iterable (``__iter__()``) and iterator (``__next__()``) protocols.

* As with ``len()``, there are ``iter()`` and ``next()`` built-ins;
  ``iter(obj)`` just calls ``obj.__iter__()``.

----

:data-emphasize-lines-step: 6,9,12,15,19

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

:data-emphasize-lines-step: 1,4,6

The true story of a for loop
----------------------------

So what really happens when I ``for x in numbers: print(x)``?

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

:data-emphasize-lines-step: 8,11

two iterators, one list
-----------------------

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

let's try writing our own
-------------------------

----

:data-emphasize-lines-step: 6,11

a fibonacci iterator
---------------------

.. code:: python
   :number-lines:

   class Fibonacci:
       def __init__(self):
           self.last = 0
           self.next = 1

       def __next__(self):
           self.last, self.next = (
               self.next, self.last + self.next)
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

more usefully
-------------

.. setup a process_lines function

   >>> processed = []

   >>> def process_line(line):
   ...     processed.append(line.strip())

.. code:: python

   import itertools

   def get_interesting_lines(fh):
       no_header = itertools.dropwhile(
           lambda line: "START BODY" not in line, fh)
       next(no_header)

       body_only = itertools.takewhile(
           lambda line: "END BODY" not in line, no_header)

       interesting_lines = filter(
           lambda line: not line.startswith('#'), body_only)

       return interesting_lines

   with open('gigantic_file.txt') as fh:
       for line in get_interesting_lines(fh):
           process_line(line)


.. check the results

   >>> processed
   ['line one', 'line two']

.. note::

   File objects are iterators yielding lines. So we can process a massive file
   one line at a time, using itertools to filter down to only lines that we
   care about.

   And we can build up logical building blocks (pipe segments) like our
   "get_interesting_lines" filter that can operate on streams one element at a
   time.

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

:data-emphasize-lines-step: 2,3,4,5,9,11,12,13,19,21

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

fibonacci generator
-------------------

.. code:: python
   :number-lines:

   def fibonacci():
       last, next = 0, 1
       while True:
           last, next = next, next + last
           yield last

.. code:: pycon
   :number-lines:

   >>> fib = fibonacci()

   >>> fib
   <generator object fibonacci at 0x...>

   >>> list(itertools.takewhile(lambda x: x < 20, fib))
   [1, 1, 2, 3, 5, 8, 13]

.. note::

   The generator implementation is clearly shorter than the iterator class we
   wrote before; a simple function instead of a class with multiple methods.

----

re-implementing itertools.takewhile
-----------------------------------

.. code:: python

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

A list comprehension is a concise expression to build/transform/filter a list:

.. code:: pycon

   >>> numbers = [1, 2, 3]

   >>> [n*2 for n in numbers]
   [2, 4, 6]

   >>> [n for n in numbers if n % 2]
   [1, 3]

----

Replace the brackets with parens, and you have a **generator expression**:

.. set up fib_under_20

   >>> fib_under_20 = takewhile(lambda x: x < 20, fibonacci())

.. code:: pycon

   >>> odd_fib = (n for n in fibonacci() if n % 2)

   >>> doubled_fib = (n*2 for n in fibonacci())

Looks just like a list comprehension, but doesn't build the full list in
memory; returns a generator which lazily waits to be iterated over.

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

:data-emphasize-lines-step: 6,7,13

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

Iterators & generators
----------------------

* Good to understand the underlying iterator protocol, but generators and
  generator expressions will do most of what you need.

* Can write data pipelines that handle long, even infinite, streams one element
  at a time, without ever bringing all data into memory.

* Can make your own classes iterable by giving them an ``__iter__()`` method.

----

Metaclasses
-----------

    “Metaclasses are deeper magic than 99% of users should ever worry about. If
    you wonder whether you need them, you don't.”

    -- Tim Peters, comp.lang.python

.. note::

   This quote is basically obligatory at this point in any discussion of Python
   metaclasses.

   That's because it is truth.

   But metaclasses are fun! So we'll talk about them anyway.

----

:data-reveal: 1

Metaclasses
-----------

* Python classes are objects, just like any other object.

* Thus, just like ``luigi`` is an instance of ``Person``, the ``Person`` class
  itself is an instance of ``type``!

* A class' class is called its "metaclass"; the default metaclass is ``type``.

* (And yes, ``type`` itself is an instance of ``type``. It's types all the way
  down.)

----

Types all the way down
----------------------

.. code:: pycon

   >>> class Person: pass

   >>> luigi = Person()

   >>> luigi.__class__
   <class 'Person'>

   >>> Person.__class__
   <class 'type'>

   >>> type.__class__
   <class 'type'>

----

:data-emphasize-lines-step: 10,11,12

Normally we create classes with a ``class`` statement.

But just as we can create an instance of ``Person`` with ``luigi = Person()``,
we can call ``type()`` to create a class:

.. code:: python
   :number-lines:

   class Singer(Person):
       activity = 'singing'

       def do(self):
           return self.activity

.. code:: python
   :number-lines:

   def do(self):
       return self.activity

   Singer = type(
       "Singer",
       (Person,),
       {'activity': 'singing', 'do': do},
       )

.. note::

   First argument to type is the name of the class to build.

   Second argument is a tuple of the classes to inherit from (can be empty).

   Third argument is a dictionary of the class attributes (including methods).

   This is equivalent to the local variables at the end of executing the body
   of a `class` block.

----

:data-emphasize-lines-step: 1,2,3,4,5,6,7,9,10,11

make your own metaclass
-----------------------

.. code:: python
   :number-lines:

   class NoisyMetaclass(type):
       def __new__(cls, name, bases, attrs, **kwds):
           print("Creating a class named {}".format(name))
           print("It inherits from {}".format(bases))
           print("It has attributes {}".format(attrs))
           return type.__new__(cls, name, bases, attrs, **kwds)

.. code:: pycon
   :number-lines:

   >>> class Person(metaclass=NoisyMetaclass):
   ...     activity = 'rowing'
   Creating a class named Person
   It inherits from ()
   It has attributes {...'activity': 'rowing'...}

----

:data-emphasize-lines-step: 3,4,5,6,11,12,19

checking interfaces
-------------------

.. code:: python
   :number-lines:

   class RequireMethods(type):
       def __new__(cls, name, bases, attrs):
           new_cls = type.__new__(cls, name, bases, attrs)
           for method in new_cls.required_methods:
               if method not in attrs:
                   raise TypeError(
                       "{} class must implement '{}'.".format(
                           name, method))
           return new_cls

   class Command(metaclass=RequireMethods):
       required_methods = {'run'}

       def run(self):
           raise NotImplementedError()

.. code:: pycon
   :number-lines:

   >>> class Install(Command):
   ...     pass
   Traceback (most recent call last):
   TypeError: Install class must implement 'run'.

.. note::

   For example, we could use a metaclass if we have a base class that others
   will be subclassing, and we want to require them to override certain methods
   in their subclass.

----

ORM field definitions
---------------------

.. ignore-next-block
.. code:: python

   class Person(models.Model):
       name = models.CharField()
       age = models.IntegerField()

.. note::

   This syntax is based on the Django ORM, but other ORMs (e.g. SQLAlchemy)
   provide similar declarative syntax for defining your db schema.

   In this case the ORM needs to know what fields are in the person table, and
   so it would use a metaclass on the base ``Model`` class to hook into the
   creation of any subclass of ``Model``.

----

:data-reveal: 1

Metaclass notes
---------------

* You probably don't want to use them.

* In Python 2, specify a metaclass with the ``__metaclass__`` class attribute,
  not a ``metaclass`` keyword argument in the bases list.

* Python 3 metaclasses can also define a ``__prepare__()`` method to hook in
  even earlier, before the class body is executed. Useful if you need to record
  the order that class attributes were given.

----

:data-reveal: 1

Review
======

* **Decorators** let you share pre- and post- behaviors between functions.

* **Context managers** let you run setup and teardown code around any block of
  code.

* **Descriptors** (and **property**) let you customize attribute access on your
  classes.

* **Iterators** and **generators** let you customize iteration behavior of your
  classes, and process/filter/transform data streams lazily one item at a time.

* **Metaclasses** let you hook into the process of creating a class.

* We only scratched the surface; go read the docs and have fun!

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
