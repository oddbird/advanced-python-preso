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

   Create a function that prints "Hi!"

   Pass it as an argument to another function (note lack of parens; with parens
   we'd be calling the function and passing in its return value, which is
   None).

   Then call it by another name, twice (now we have parens!)

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

   The list_widgets view returns a TemplateResponse, which renders an HTML
   template but does so lazily, meaning our decorator can still poke at the
   context (values passed to template) before the template is rendered. In this
   case we sort the queryset based on a field name given in the request.

   This decorator could be applied to provide generic sortability to any view
   that renders a queryset in its template.

   (Note: needs error handling.)

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

   class MyOpen():
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

   As we just saw, the ``open`` built-in already can act like a context
   manager. But if it didn't, here's a simplified example of how we could
   implement a context manager to manage opening and closing a file.

   We implement two methods, ``__enter__`` and ``__exit__``. The return value
   of ``__enter__`` can be anything we like; the user of the context manager
   can get access to it via the ``as`` keyword.

----

:id: questions

Questions?
==========

* `oddbird.net/advanced-python-preso`_
* `docs.python.org/3/glossary.html#term-decorator`_

.. _oddbird.net/advanced-python-preso: http://oddbird.net/advanced-python-preso
.. _docs.python.org/3/glossary.html#term-decorator: http://docs.python.org/3/glossary.html#term-decorator

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
