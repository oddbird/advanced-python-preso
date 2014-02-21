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

Functions are first class:

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
:data-emphasize-lines-step: 11,13
:data-kill-linenos: 1

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
:data-kill-linenos: 1

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
:data-kill-linenos: 1

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
:data-kill-linenos: 1

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

:data-emphasize-lines-step: 2,6,9

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

:data-emphasize-lines-step: 9,10

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

Caution
-------

* Decorator becomes part of the function.

* Can't test the plain pre-decorated function.

* Only use if:

* Decorated version is equally testable

* and the only version you need.

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

And the context manager closes the file for us at the end of the block.

.. note::

   More concise syntax for resource management / cleanup.

----

:data-emphasize-lines-step: 2,6,7,8,10,11,13

Writing a context manager
-------------------------

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

:data-emphasize-lines-step: 7,9,13,17
:data-kill-linenos: 1

Exception handling
------------------

.. code:: pycon
   :number-lines:

   >>> class NoisyCM:
   ...     def __enter__(self):
   ...         print("Entering!")
   ...
   ...     def __exit__(self, exc_type, exc_value, traceback):
   ...         print("Exiting!")
   ...         if exc_type is not None:
   ...             print("Caught {}".format(exc_type.__name__))
   ...             return True

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
:data-kill-linenos: 1

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

:id: questions

Questions?
==========

* `oddbird.net/advanced-python-preso`_
* `docs.python.org/3/glossary.html#term-decorator`_
* `docs.python.org/3/reference/datamodel.html#context-managers`_
* `docs.python.org/3/howto/descriptor.html`_

.. _oddbird.net/advanced-python-preso: http://oddbird.net/advanced-python-preso
.. _docs.python.org/3/glossary.html#term-decorator: http://docs.python.org/3/glossary.html#term-decorator
.. _docs.python.org/3/reference/datamodel.html#context-managers: http://docs.python.org/3/reference/datamodel.html#context-managers
.. _docs.python.org/3/howto/descriptor.html: http://docs.python.org/3/howto/descriptor.html

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
