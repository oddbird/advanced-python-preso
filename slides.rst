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

* Toy example

* Real example(s)

* Just a taste!

* Cautions?

* Link to docs

* Python 3

.. note::

   No stress; doc links will be live in online slides.

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

   Create a function that prints "Hi!"

   Pass it as an argument to another function (note lack of parens; with parens
   we'd be calling the function and passing in its return value, which is
   None).

   Then call it by another name, twice (now we have parens!)

----

:data-reveal: 1

Decorator
=========

A function that takes a function as an argument, and returns a function.

.. code:: pycon

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

Decorator syntax:

.. code:: python

   @noisy
   def say_hi():
       print("Hi!")

is equivalent to:

.. code:: python

   def say_hi():
       print("Hi!")

   say_hi = noisy(say_hi)

.. note::

   If we don't need the original (undecorated) function.

----

Either way:

.. code:: pycon

   >>> say_hi()
   Before
   Hi!
   After

----

But:

.. code:: pycon

   >>> say_hi
   <function noisy.<locals>.decorated at 0x7f097b7263b0>

   >>> help(say_hi)
   Help on function decorated in module __main__:

   decorated()

----

Fixing ``repr()`` and ``help()``:

.. code:: python

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

Fixed!

.. code:: pycon

   >>> @noisy
   ... def say_hi():
   ...     print("Hi!")
   ...

   >>> say_hi
   <function say_hi at 0x7f097b73a4d0>

   >>> help(say_hi)
   Help on function say_hi in module __main__:

   say_hi()

----

Let's try our decorator on another function:

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

----

Use ``*args`` and ``**kwargs`` to write decorators that can wrap functions
taking any arguments:

.. code:: python

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

A real example:

.. code:: python

   def login_required(view_func):
       @wraps(view_func)
       def decorated(request, *args, **kwargs):
           if not request.user.is_authenticated():
               return redirect('/login/')
           return view_func(request, *args, **kwargs)
       return decorated

   @login_required
   def edit_profile(request):
       # ...

.. note::

   Simplified from the actual implementation.

   Here we are hardcoding the login URL to redirect to.

----

A decorator that takes arguments:

.. code:: python

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
       # ...

.. note::

   A decorator that takes arguments is really a decorator factory: a function
   that returns a decorator.

   And a decorator, of course, is a function that returns a function: so we end
   up with double-nested closures.

----

A decorator that may or may not take arguments:

.. code:: python

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
        # ...

    @login_required(login_url='/other_login/')
    def edit_profile(request):
        # ...

.. note::

   Combining the last two forms of decorators, returning either a decorator, or
   an already-decorated view function, depending what arguments we get.

   Could avoid the implementation complexity if we didn't mind a pair of empty
   parens in the first usage, but requiring those makes it easier to use the
   decorator wrong.

   This requires passing in login_url as a keyword argument, we could be even
   cleverer if we want by type-checking the first argument (is it a function?
   is it a string?)

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
